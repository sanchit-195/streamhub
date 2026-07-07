import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const likeSchema = new Schema(
  {
    // Reference to the comment that was liked
    comment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
    // Reference to the video that was liked
    video: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
    },
    // The user who performed the like (references the 'users' collection)
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Reference to the tweet that was liked
    tweet: {
      type: Schema.Types.ObjectId,
      ref: 'Tweet',
    },
  },
  {
    // Automatically handles the 'createdAt' and 'updatedAt' Date fields
    timestamps: true,
  }
);

likeSchema.plugin(mongooseAggregatePaginate);

export const Like = mongoose.model('Like', likeSchema);