import React, { useState } from 'react';
import { Star, MessageSquare, CheckCircle, Send, ShieldCheck } from 'lucide-react';
import { Review } from '../types';

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  reviews: Review[];
  onAddReview: (review: Omit<Review, 'id' | 'date' | 'status'>) => void;
}

export default function ProductReviewsSection({
  productId,
  productName,
  reviews,
  onAddReview
}: ProductReviewsSectionProps) {
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const productReviews = reviews.filter((r) => r.productId === productId && r.status === 'approved');
  const avgRating = productReviews.length > 0
    ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
    : '5.0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim()) return;

    onAddReview({
      productId,
      productName,
      author,
      rating,
      comment,
      isVerified: true
    });

    setAuthor('');
    setComment('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="space-y-6 pt-6 border-t border-gray-100">
      {/* Header & Rating Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold font-display text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-gold" /> Patron Reviews & Ratings
          </h3>
          <p className="text-xs text-gray-500">Verified customer feedback for {productName}</p>
        </div>

        <div className="flex items-center gap-3 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
          <div className="flex items-center gap-1 text-amber-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${star <= Math.round(Number(avgRating)) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <span className="font-bold text-sm font-mono text-gray-900">{avgRating} / 5.0</span>
          <span className="text-xs text-gray-500">({productReviews.length} reviews)</span>
        </div>
      </div>

      {/* Write a Review Form */}
      <form onSubmit={handleSubmit} className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Write a Review</h4>
        
        {submitted && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Thank you! Your review has been submitted for moderation.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Your Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Priyantha D."
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Star Rating</label>
            <div className="flex items-center gap-1 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-0.5 cursor-pointer hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-5 h-5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Your Feedback</label>
          <textarea
            required
            rows={2}
            placeholder="Share your thoughts on the taste, freshness, and presentation..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold bg-white"
          />
        </div>

        <button
          type="submit"
          className="bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
        >
          <Send className="w-3.5 h-3.5" /> Submit Review
        </button>
      </form>

      {/* Review List */}
      <div className="space-y-3">
        {productReviews.length === 0 ? (
          <p className="text-xs text-gray-400 italic text-center py-4">Be the first to leave a review for this delicious bake!</p>
        ) : (
          productReviews.map((rev) => (
            <div key={rev.id} className="p-3.5 rounded-xl bg-white border border-gray-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{rev.author}</span>
                  {rev.isVerified && (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Buyer
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400">{rev.date}</span>
              </div>

              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${star <= rev.rating ? 'fill-amber-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>

              <p className="text-gray-700">{rev.comment}</p>

              {rev.adminReply && (
                <div className="bg-amber-50/70 p-2.5 rounded-lg border-l-2 border-brand-gold text-[11px]">
                  <span className="font-bold text-brand-blue block">Thinesh Bake House Response:</span>
                  <span className="text-gray-700">{rev.adminReply}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
