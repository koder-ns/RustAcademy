import { NotFoundException } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseLevel } from './interfaces/course-level.enum';

describe('CourseService', () => {
  let service: CourseService;

  beforeEach(() => {
    service = new CourseService();
  });

  // ---------------------------------------------------------------------------
  // Baseline CRUD behavior (unchanged from pre-versioning baseline)
  // ---------------------------------------------------------------------------

  it('creates a course at version 1 with an initial revision', async () => {
    const course = await service.create({
      title: 'Rust 101',
      description: 'Intro to Rust',
      level: CourseLevel.BEGINNER,
      order: 1,
      learningPathId: 'path-rust',
      duration: 60,
      xpReward: 50,
    });

    expect(course.id).toBeDefined();
    expect(course.version).toBe(1);
    expect(course.latestRevisionId).toBeDefined();

    const revisions = await service.getRevisions(course.id);
    expect(revisions).toHaveLength(1);
    expect(revisions[0].version).toBe(1);
    expect(revisions[0].reason).toBe('create');
    expect(revisions[0].snapshot.title).toBe('Rust 101');
  });

  it('returns only active courses from findAll()', async () => {
    const active = await service.create({
      title: 'Active',
      description: 'Active course',
      level: CourseLevel.BEGINNER,
      order: 1,
      learningPathId: 'path-1',
      duration: 30,
    });
    const inactive = await service.create({
      title: 'Inactive',
      description: 'Draft course',
      level: CourseLevel.BEGINNER,
      order: 2,
      learningPathId: 'path-1',
      duration: 30,
    });
    await service.update(inactive.id, { isActive: false });

    const all = await service.findAll();
    expect(all.map((c) => c.id)).toEqual([active.id]);
  });

  // ---------------------------------------------------------------------------
  // Versioning on update
  // ---------------------------------------------------------------------------

  it('increments version and appends a revision on each update', async () => {
    const course = await service.create({
      title: 'Title v1',
      description: 'Desc v1',
      level: CourseLevel.BEGINNER,
      order: 1,
      learningPathId: 'path-1',
      duration: 30,
    });
    expect(course.version).toBe(1);

    const updated = await service.update(course.id, {
      title: 'Title v2',
      changeNote: 'Tightened wording',
      revisionAuthor: 'editor-1',
    });
    expect(updated).not.toBeNull();
    expect(updated!.version).toBe(2);
    expect(updated!.title).toBe('Title v2');
    expect(updated!.latestRevisionId).toBeDefined();

    const updated2 = await service.update(course.id, {
      description: 'Desc v3',
      changeNote: 'Expanded goals',
      revisionAuthor: 'editor-2',
    });
    expect(updated2!.version).toBe(3);

    const revisions = await service.getRevisions(course.id);
    expect(revisions.map((r) => r.version)).toEqual([1, 2, 3]);
    expect(revisions[1].changeNote).toBe('Tightened wording');
    expect(revisions[1].revisionAuthor).toBe('editor-1');
    expect(revisions[1].reason).toBe('update');
    expect(revisions[1].previousVersion).toBe(1);
    expect(revisions[2].snapshot.title).toBe('Title v2'); // carries forward previous edits
    expect(revisions[2].snapshot.description).toBe('Desc v3');
  });

  it('updates latestRevisionId to point at the most recent revision', async () => {
    const course = await service.create({
      title: 'Token Test',
      description: 'Test',
      level: CourseLevel.BEGINNER,
      order: 1,
      learningPathId: 'path-1',
      duration: 30,
    });
    const firstLatestId = course.latestRevisionId;

    const updated = await service.update(course.id, { title: 'Token Test 2' });
    expect(updated!.latestRevisionId).not.toEqual(firstLatestId);

    const latest = await service.getLatestRevision(course.id);
    expect(latest).not.toBeNull();
    expect(latest!.id).toBe(updated!.latestRevisionId);
    expect(latest!.snapshot.title).toBe('Token Test 2');
  });

  it('preserves a deep copy of the snapshot so later updates do not mutate history', async () => {
    const course = await service.create({
      title: 'Snapshot Test',
      description: 'Desc',
      level: CourseLevel.BEGINNER,
      order: 1,
      learningPathId: 'path-1',
      duration: 30,
      prerequisites: ['rust-basics'],
    });
    await service.update(course.id, {
      prerequisites: ['rust-basics', 'ownership'],
      skills: ['borrowing'],
    });

    const revisions = await service.getRevisions(course.id);
    expect(revisions[0].snapshot.prerequisites).toEqual(['rust-basics']);
    expect(revisions[1].snapshot.prerequisites).toEqual([
      'rust-basics',
      'ownership',
    ]);
  });

  // ---------------------------------------------------------------------------
  // Revision lookup
  // ---------------------------------------------------------------------------

  it('returns the correct revision by version', async () => {
    const course = await service.create({
      title: 'Lookup',
      description: 'Desc',
      level: CourseLevel.BEGINNER,
      order: 1,
      learningPathId: 'path-1',
      duration: 30,
    });
    await service.update(course.id, { title: 'Lookup v2' });

    const v1 = await service.getRevisionByVersion(course.id, 1);
    const v2 = await service.getRevisionByVersion(course.id, 2);

    expect(v1).not.toBeNull();
    expect(v1!.snapshot.title).toBe('Lookup');
    expect(v2).not.toBeNull();
    expect(v2!.snapshot.title).toBe('Lookup v2');
  });

  it('returns null for a missing revision version', async () => {
    const course = await service.create({
      title: 'MissingVersion',
      description: 'Desc',
      level: CourseLevel.BEGINNER,
      order: 1,
      learningPathId: 'path-1',
      duration: 30,
    });
    const result = await service.getRevisionByVersion(course.id, 99);
    expect(result).toBeNull();
  });

  it('returns an empty array when listing revisions for an unknown course', async () => {
    const revisions = await service.getRevisions('non-existent');
    expect(revisions).toEqual([]);
    expect(await service.getRevisionByVersion('non-existent', 1)).toBeNull();
    expect(await service.getRevisionCount('non-existent')).toBe(0);
    expect(await service.getLatestRevision('non-existent')).toBeNull();
  });

  it('throws NotFoundException for non-positive revision versions', async () => {
    const course = await service.create({
      title: 'BadVersion',
      description: 'Desc',
      level: CourseLevel.BEGINNER,
      order: 1,
      learningPathId: 'path-1',
      duration: 30,
    });
    await expect(service.getRevisionByVersion(course.id, 0)).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.getRevisionByVersion(course.id, -1)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('counts the number of revisions correctly', async () => {
    const course = await service.create({
      title: 'Counter',
      description: 'Desc',
      level: CourseLevel.BEGINNER,
      order: 1,
      learningPathId: 'path-1',
      duration: 30,
    });
    expect(await service.getRevisionCount(course.id)).toBe(1);
    await service.update(course.id, { title: 'Counter v2' });
    expect(await service.getRevisionCount(course.id)).toBe(2);
  });

  // ---------------------------------------------------------------------------
  // Restore behavior
  // ---------------------------------------------------------------------------

  it('restores a course to a previous version and records a new revision', async () => {
    const course = await service.create({
      title: 'Original',
      description: 'Original desc',
      level: CourseLevel.BEGINNER,
      order: 1,
      learningPathId: 'path-1',
      duration: 30,
      prerequisites: [],
    });
    await service.update(course.id, {
      title: 'Second',
      description: 'Second desc',
      prerequisites: ['pre-1'],
    });
    await service.update(course.id, {
      title: 'Third',
      description: 'Third desc',
      prerequisites: ['pre-1', 'pre-2'],
    });

    const restored = await service.restoreRevision(
      course.id,
      1,
      'editor-restore',
    );
    expect(restored).not.toBeNull();
    expect(restored!.title).toBe('Original');
    expect(restored!.description).toBe('Original desc');
    expect(restored!.prerequisites).toEqual([]);
    // Restoring bumps the version forward (append-only history)
    expect(restored!.version).toBe(4);

    const revisions = await service.getRevisions(course.id);
    expect(revisions.map((r) => r.version)).toEqual([1, 2, 3, 4]);
    expect(revisions[3].reason).toBe('restore');
    expect(revisions[3].changeNote).toBe('Restored from version 1');
    expect(revisions[3].revisionAuthor).toBe('editor-restore');
    expect(revisions[3].previousVersion).toBe(3);
    expect(revisions[3].referenceRevisionId).toBe(revisions[0].id);
  });

  it('throws NotFoundException when restoring a course that does not exist', async () => {
    await expect(service.restoreRevision('ghost-course', 1)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws NotFoundException when restoring from a non-existent revision', async () => {
    const course = await service.create({
      title: 'RestoreFail',
      description: 'Desc',
      level: CourseLevel.BEGINNER,
      order: 1,
      learningPathId: 'path-1',
      duration: 30,
    });
    await expect(service.restoreRevision(course.id, 99)).rejects.toThrow(
      NotFoundException,
    );
  });

  // ---------------------------------------------------------------------------
  // Removal preserves revision history
  // ---------------------------------------------------------------------------

  it('removes the course but keeps its revision history queryable for audit', async () => {
    const course = await service.create({
      title: 'ToDelete',
      description: 'Desc',
      level: CourseLevel.BEGINNER,
      order: 1,
      learningPathId: 'path-1',
      duration: 30,
    });

    expect(await service.remove(course.id)).toBe(true);

    // The course itself is gone
    expect(await service.findById(course.id)).toBeNull();
    // But the revision snapshot is preserved for audit purposes
    const revisions = await service.getRevisions(course.id);
    expect(revisions).toHaveLength(1);
    expect(revisions[0].snapshot.title).toBe('ToDelete');
    expect(await service.getRevisionByVersion(course.id, 1)).not.toBeNull();
    expect(await service.getRevisionCount(course.id)).toBe(1);
  });
});
