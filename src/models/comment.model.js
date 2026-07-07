import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    // The 'video' field linking to the 'videos' collection
    video: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
    },
    // The 'owner' field linking to the 'users' collection
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    // Automatically handles the 'createdAt' and 'updatedAt' Date fields shown in the image
    timestamps: true,
  }
);

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model('Comment', commentSchema);