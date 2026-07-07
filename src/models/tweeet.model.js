import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const tweetSchema = new Schema(
  {
    // The user who posted the tweet (reference to the 'users' collection)
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The actual text content of the tweet
    content: {
      type: String,
      required: true,
    },
  },
  {
    // Automatically handles the 'createdAt' and 'updatedAt' Date fields
    timestamps: true,
  }
);

tweetSchema.plugin(mongooseAggregatePaginate);

export const Tweet = mongoose.model('Tweet', tweetSchema);