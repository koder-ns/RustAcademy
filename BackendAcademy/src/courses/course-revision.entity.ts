import { CourseLevel } from './interfaces/course-level.enum';

/**
 * Immutable historical snapshot of a course at a given version.
 *
 * Each `CourseRevisionEntity` represents one entry in a course's
 * revision history. Revisions are append-only and never mutated
 * after creation; subsequent updates create new revisions.
 */
export class CourseRevisionEntity {
  id: string;
  courseId: string;
  version: number;
  /** Immutable snapshot of the course content at this version */
  snapshot: {
    title: string;
    description: string;
    level: CourseLevel;
    order: number;
    learningPathId: string;
    duration: number;
    prerequisites: string[];
    skills: string[];
    xpReward: number;
    isActive: boolean;
  };
  /** Optional human-readable summary of what changed */
  changeNote?: string;
  /** Optional author/editor identifier who created this revision */
  revisionAuthor?: string;
  /** Optional reason this revision was created (e.g. 'update', 'restore') */
  reason: CourseRevisionReason;
  /** Version that was active immediately before this revision, for traceability */
  previousVersion?: number;
  referenceRevisionId?: string;
  createdAt: Date;

  constructor(partial: Partial<CourseRevisionEntity>) {
    Object.assign(this, partial);
    this.createdAt = this.createdAt || new Date();
    this.reason = this.reason || 'update';
  }
}

export type CourseRevisionReason = 'create' | 'update' | 'restore';
