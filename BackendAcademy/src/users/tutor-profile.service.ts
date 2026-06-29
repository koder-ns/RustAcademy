import { Injectable, NotFoundException } from '@nestjs/common';
import { TutorProfileEntity } from './tutor-profile.entity';
import { CreateTutorProfileDto } from './dto/create-tutor-profile.dto';
import { UpdateTutorProfileDto } from './dto/update-tutor-profile.dto';
import { RateTutorDto } from './dto/rate-tutor.dto';
import { Review, ReputationDetails } from './interfaces/review.interface';

export interface TutorEarningsSummary {
  tutorId: string;
  earnedXlm: number;
  totalPaidOut: number;
  pendingPayouts: number;
  payouts: Array<{
    id: string;
    amount: number;
    status: 'pending' | 'completed';
    paidAt?: Date;
  }>;
}

@Injectable()
export class TutorProfileService {
  private readonly profiles: Map<string, TutorProfileEntity> = new Map();
  private readonly reviews: Map<string, Review> = new Map();

  async create(dto: CreateTutorProfileDto): Promise<TutorProfileEntity> {
    const profile = new TutorProfileEntity({
      id: crypto.randomUUID(),
      ...dto,
    });
    this.profiles.set(profile.id, profile);
    return profile;
  }

  async findAll(): Promise<TutorProfileEntity[]> {
    return Array.from(this.profiles.values());
  }

  async findById(id: string): Promise<TutorProfileEntity | null> {
    return this.profiles.get(id) || null;
  }

  async findByUserId(userId: string): Promise<TutorProfileEntity | null> {
    return (
      Array.from(this.profiles.values()).find(p => p.userId === userId) || null
    );
  }

  async findBySpecialty(specialty: string): Promise<TutorProfileEntity[]> {
    return Array.from(this.profiles.values()).filter(p =>
      p.specialties.includes(specialty as any),
    );
  }

  async update(
    id: string,
    dto: UpdateTutorProfileDto,
  ): Promise<TutorProfileEntity | null> {
    const profile = this.profiles.get(id);
    if (!profile) return null;
    Object.assign(profile, dto, { updatedAt: new Date() });
    profile.reputationScore = this.calculateReputation(profile);
    return profile;
  }

  async rate(id: string, dto: RateTutorDto): Promise<TutorProfileEntity> {
    const profile = this.profiles.get(id);
    if (!profile) throw new NotFoundException('Tutor profile not found');

    const total = profile.totalRatings * profile.averageRating + dto.rating;
    profile.totalRatings += 1;
    profile.averageRating = total / profile.totalRatings;

    const review: Review = {
      id: crypto.randomUUID(),
      tutorProfileId: id,
      raterUserId: dto.raterUserId,
      rating: dto.rating,
      review: dto.review,
      createdAt: new Date(),
    };
    this.reviews.set(review.id, review);

    profile.reputationScore = this.calculateReputation(profile);
    profile.updatedAt = new Date();
    return profile;
  }

  async getReviews(tutorProfileId: string): Promise<Review[]> {
    const profile = this.profiles.get(tutorProfileId);
    if (!profile) throw new NotFoundException('Tutor profile not found');

    return Array.from(this.reviews.values())
      .filter(r => r.tutorProfileId === tutorProfileId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id));
  }

  async getReputation(tutorProfileId: string): Promise<ReputationDetails> {
    const profile = this.profiles.get(tutorProfileId);
    if (!profile) throw new NotFoundException('Tutor profile not found');

    const reviewCount = Array.from(this.reviews.values()).filter(
      r => r.tutorProfileId === tutorProfileId,
    ).length;

    const avgRatingNorm = (profile.averageRating / 5) * 100;
    const ratingCountNorm = Math.min(profile.totalRatings / 100, 1) * 100;
    const verifiedScore = profile.isVerified ? 100 : 0;
    const coursesNorm = Math.min(profile.coursesCreated / 20, 1) * 100;

    return {
      tutorId: profile.id,
      reputationScore: profile.reputationScore,
      averageRating: profile.averageRating,
      totalRatings: profile.totalRatings,
      isVerified: profile.isVerified,
      coursesCreated: profile.coursesCreated,
      reviewCount,
      breakdown: {
        averageRatingWeight: +(avgRatingNorm * 0.5).toFixed(2),
        ratingCountWeight: +(ratingCountNorm * 0.15).toFixed(2),
        verifiedWeight: +(verifiedScore * 0.2).toFixed(2),
        coursesWeight: +(coursesNorm * 0.15).toFixed(2),
      },
    };
  }

  async incrementCoursesCreated(id: string): Promise<void> {
    const profile = this.profiles.get(id);
    if (profile) {
      profile.coursesCreated += 1;
      profile.reputationScore = this.calculateReputation(profile);
      profile.updatedAt = new Date();
    }
  }

  async updateEarnings(id: string, amount: number): Promise<void> {
    const profile = this.profiles.get(id);
    if (profile) {
      profile.totalEarnings += amount;
      profile.updatedAt = new Date();
    }
  }

  async getEarningsSummary(id: string): Promise<TutorEarningsSummary> {
    const profile = this.profiles.get(id);
    if (!profile) {
      throw new NotFoundException('Tutor profile not found');
    }

    return {
      tutorId: profile.id,
      earnedXlm: profile.totalEarnings,
      totalPaidOut: 0,
      pendingPayouts: 0,
      payouts: [],
    };
  }

  async remove(id: string): Promise<boolean> {
    const deleted = this.profiles.delete(id);
    if (deleted) {
      for (const [reviewId, review] of this.reviews) {
        if (review.tutorProfileId === id) {
          this.reviews.delete(reviewId);
        }
      }
    }
    return deleted;
  }

  private calculateReputation(profile: TutorProfileEntity): number {
    const avgRatingNorm = (profile.averageRating / 5) * 100;
    const ratingCountNorm = Math.min(profile.totalRatings / 100, 1) * 100;
    const verifiedScore = profile.isVerified ? 100 : 0;
    const coursesNorm = Math.min(profile.coursesCreated / 20, 1) * 100;

    const score =
      avgRatingNorm * 0.5 +
      ratingCountNorm * 0.15 +
      verifiedScore * 0.2 +
      coursesNorm * 0.15;

    return +score.toFixed(2);
  }
}
