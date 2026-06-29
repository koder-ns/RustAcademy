import { NotFoundException } from '@nestjs/common';
import { TutorProfileService } from './tutor-profile.service';
import { TutorSpecialty } from './interfaces/tutor-specialty.enum';

describe('TutorProfileService', () => {
  let service: TutorProfileService;

  beforeEach(() => {
    service = new TutorProfileService();
  });

  describe('Earnings', () => {
    it('getEarningsSummary() returns earned XLM and payout details for a tutor', async () => {
      const profile = await service.create({
        userId: 'user-1',
        bio: 'Test tutor',
        specialties: [TutorSpecialty.WEB3_SOROBAN],
        hourlyRate: 50,
      });

      await service.updateEarnings(profile.id, 120);

      const summary = await service.getEarningsSummary(profile.id);

      expect(summary).toMatchObject({
        tutorId: profile.id,
        earnedXlm: 120,
        totalPaidOut: 0,
        pendingPayouts: 0,
        payouts: [],
      });
    });

    it('getEarningsSummary() throws when the tutor profile does not exist', async () => {
      await expect(service.getEarningsSummary('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Rating and Reviews', () => {
    it('rate() stores a review and updates averageRating and totalRatings', async () => {
      const profile = await service.create({
        userId: 'user-tutor',
        bio: 'Math tutor',
        specialties: [TutorSpecialty.RUST_FUNDAMENTALS],
        hourlyRate: 40,
      });

      const updated = await service.rate(profile.id, {
        raterUserId: 'user-rater',
        rating: 5,
        review: 'Excellent tutor',
      });

      expect(updated.totalRatings).toBe(1);
      expect(updated.averageRating).toBe(5);
      expect(updated.reputationScore).toBeGreaterThan(0);
    });

    it('rate() updates aggregate correctly after multiple ratings', async () => {
      const profile = await service.create({
        userId: 'user-tutor-2',
        bio: 'Rust expert',
        specialties: [TutorSpecialty.ADVANCED_RUST],
        hourlyRate: 60,
      });

      await service.rate(profile.id, {
        raterUserId: 'rater-1',
        rating: 5,
      });
      await service.rate(profile.id, {
        raterUserId: 'rater-2',
        rating: 3,
      });

      const updated = await service.rate(profile.id, {
        raterUserId: 'rater-3',
        rating: 4,
      });

      expect(updated.totalRatings).toBe(3);
      expect(updated.averageRating).toBe(4);
      expect(updated.reputationScore).toBeGreaterThan(0);
    });

    it('rate() throws when tutor profile does not exist', async () => {
      await expect(
        service.rate('nonexistent-id', {
          raterUserId: 'rater-1',
          rating: 5,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getReviews()', () => {
    it('returns all reviews for a tutor sorted by newest first', async () => {
      const profile = await service.create({
        userId: 'user-tutor-3',
        bio: 'Bio',
        specialties: [TutorSpecialty.ASYNC_RUST],
      });

      await service.rate(profile.id, {
        raterUserId: 'rater-1',
        rating: 4,
        review: 'Good',
      });
      await new Promise(r => setTimeout(r, 5));
      await service.rate(profile.id, {
        raterUserId: 'rater-2',
        rating: 5,
        review: 'Great',
      });

      const reviews = await service.getReviews(profile.id);

      expect(reviews).toHaveLength(2);
      expect(reviews[0].rating).toBe(5);
      expect(reviews[0].raterUserId).toBe('rater-2');
    });

    it('throws when tutor profile does not exist', async () => {
      await expect(service.getReviews('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getReputation()', () => {
    it('returns reputation details for a tutor', async () => {
      const profile = await service.create({
        userId: 'user-tutor-4',
        bio: 'Verified tutor',
        specialties: [TutorSpecialty.WEB3_SOROBAN],
        hourlyRate: 100,
      });

      await service.rate(profile.id, {
        raterUserId: 'rater-1',
        rating: 5,
      });
      await service.rate(profile.id, {
        raterUserId: 'rater-2',
        rating: 4,
      });

      const rep = await service.getReputation(profile.id);

      expect(rep.tutorId).toBe(profile.id);
      expect(rep.averageRating).toBe(4.5);
      expect(rep.totalRatings).toBe(2);
      expect(rep.reviewCount).toBe(2);
      expect(rep.reputationScore).toBeGreaterThan(0);
      expect(rep.breakdown).toBeDefined();
      expect(rep.breakdown.averageRatingWeight).toBeGreaterThan(0);
      expect(rep.breakdown.ratingCountWeight).toBeGreaterThan(0);
    });

    it('reputation score increases when tutor is verified', async () => {
      const profile = await service.create({
        userId: 'user-tutor-5',
        bio: 'Bio',
        specialties: [TutorSpecialty.RUST_FUNDAMENTALS],
      });

      await service.rate(profile.id, {
        raterUserId: 'rater-1',
        rating: 5,
      });

      const before = await service.getReputation(profile.id);

      await service.update(profile.id, { isVerified: true });

      const after = await service.getReputation(profile.id);

      expect(after.reputationScore).toBeGreaterThan(before.reputationScore);
    });

    it('throws when tutor profile does not exist', async () => {
      await expect(service.getReputation('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
