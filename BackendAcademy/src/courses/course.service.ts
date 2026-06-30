import { Injectable, NotFoundException } from '@nestjs/common';
import { CourseEntity } from './course.entity';
import {
  CourseRevisionEntity,
  CourseRevisionReason,
} from './course-revision.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CourseService {
  private readonly courses: Map<string, CourseEntity> = new Map();
  private readonly revisions: Map<string, CourseRevisionEntity> = new Map();

  async create(dto: CreateCourseDto): Promise<CourseEntity> {
    const course = new CourseEntity({
      id: crypto.randomUUID(),
      ...dto,
    });
    this.courses.set(course.id, course);
    this.recordRevision(course, 'create', {
      changeNote: 'Initial version',
    });
    return course;
  }

  async findAll(): Promise<CourseEntity[]> {
    return Array.from(this.courses.values()).filter((c) => c.isActive);
  }

  async findByLevel(level: string): Promise<CourseEntity[]> {
    return Array.from(this.courses.values()).filter(
      (c) => c.isActive && c.level === level,
    );
  }

  async findById(id: string): Promise<CourseEntity | null> {
    return this.courses.get(id) || null;
  }

  async update(id: string, dto: UpdateCourseDto): Promise<CourseEntity | null> {
    const course = this.courses.get(id);
    if (!course) return null;

    const previousVersion = course.version;
    Object.assign(course, dto, {
      updatedAt: new Date(),
      version: previousVersion + 1,
    });
    this.recordRevision(course, 'update', {
      changeNote: dto.changeNote,
      revisionAuthor: dto.revisionAuthor,
      previousVersion,
    });
    return course;
  }

  async remove(id: string): Promise<boolean> {
    const course = this.courses.get(id);
    if (!course) return false;
    this.courses.delete(id);
    // Revisions are retained in the revisions Map even after the course is
    // removed so admins can audit what content was previously published.
    return true;
  }

  /**
   * Returns the full revision history for a course, ordered by version ascending.
   * Revisions remain queryable even after the parent course has been removed
   * so the audit trail can still be inspected.
   */
  async getRevisions(courseId: string): Promise<CourseRevisionEntity[]> {
    return Array.from(this.revisions.values())
      .filter((revision) => revision.courseId === courseId)
      .sort((a, b) => a.version - b.version);
  }

  /**
   * Returns the latest revision for a course, or null when no revisions exist.
   */
  async getLatestRevision(
    courseId: string,
  ): Promise<CourseRevisionEntity | null> {
    const courseRevisions = Array.from(this.revisions.values()).filter(
      (revision) => revision.courseId === courseId,
    );
    if (courseRevisions.length === 0) return null;
    return courseRevisions.reduce((latest, current) =>
      current.version > latest.version ? current : latest,
    );
  }

  /**
   * Returns a specific revision by its numeric version for a given course.
   * Returns null when the course or revision cannot be found.
   */
  async getRevisionByVersion(
    courseId: string,
    version: number,
  ): Promise<CourseRevisionEntity | null> {
    if (!Number.isFinite(version) || version < 1) {
      throw new NotFoundException({
        error: 'INVALID_VERSION',
        message: `Version must be a positive integer`,
      });
    }
    return (
      Array.from(this.revisions.values()).find(
        (revision) =>
          revision.courseId === courseId && revision.version === version,
      ) || null
    );
  }

  /**
   * Restores the content of a course to a previous revision. The restore
   * operation itself is recorded as a new revision so the audit trail remains
   * append-only and the current version always points at the latest revision.
   */
  async restoreRevision(
    courseId: string,
    version: number,
    revisionAuthor?: string,
  ): Promise<CourseEntity | null> {
    const course = this.courses.get(courseId);
    if (!course) {
      throw new NotFoundException({
        error: 'COURSE_NOT_FOUND',
        message: `Course with ID ${courseId} not found`,
      });
    }

    const sourceRevision = await this.getRevisionByVersion(courseId, version);
    if (!sourceRevision) {
      throw new NotFoundException({
        error: 'REVISION_NOT_FOUND',
        message: `Revision ${version} not found for course ${courseId}`,
      });
    }

    const previousVersion = course.version;
    const target = sourceRevision.snapshot;
    course.title = target.title;
    course.description = target.description;
    course.level = target.level;
    course.order = target.order;
    course.learningPathId = target.learningPathId;
    course.duration = target.duration;
    course.prerequisites = [...target.prerequisites];
    course.skills = [...target.skills];
    course.xpReward = target.xpReward;
    course.isActive = target.isActive;
    course.version = previousVersion + 1;
    course.updatedAt = new Date();

    this.recordRevision(course, 'restore', {
      changeNote: `Restored from version ${version}`,
      revisionAuthor,
      previousVersion,
      referenceRevisionId: sourceRevision.id,
    });
    return course;
  }

  /**
   * Returns the total number of revisions recorded for a course.
   */
  async getRevisionCount(courseId: string): Promise<number> {
    return Array.from(this.revisions.values()).filter(
      (revision) => revision.courseId === courseId,
    ).length;
  }

  /**
   * Internal helper: append a revision representing the current state of the
   * course. Revisions are immutable once recorded. The course id is used to
   * scope all subsequent revision lookups.
   */
  private recordRevision(
    course: CourseEntity,
    reason: CourseRevisionReason,
    options: {
      changeNote?: string;
      revisionAuthor?: string;
      previousVersion?: number;
      referenceRevisionId?: string;
    } = {},
  ): CourseRevisionEntity {
    const revision = new CourseRevisionEntity({
      id: crypto.randomUUID(),
      courseId: course.id,
      version: course.version,
      snapshot: {
        title: course.title,
        description: course.description,
        level: course.level,
        order: course.order,
        learningPathId: course.learningPathId,
        duration: course.duration,
        prerequisites: [...(course.prerequisites ?? [])],
        skills: [...(course.skills ?? [])],
        xpReward: course.xpReward,
        isActive: course.isActive,
      },
      changeNote: options.changeNote,
      revisionAuthor: options.revisionAuthor,
      reason,
      previousVersion: options.previousVersion,
      referenceRevisionId: options.referenceRevisionId,
    });
    this.revisions.set(revision.id, revision);
    course.latestRevisionId = revision.id;
    return revision;
  }
}
