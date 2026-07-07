import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const playlistSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    // Array of ObjectIds linking to the 'videos' collection
    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],
    // The user who owns the playlist
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    // Automatically handles the 'createdAt' and 'updatedAt' Date fields
    timestamps: true,
  }
);

playlistSchema.plugin(mongooseAggregatePaginate);

export const Playlist = mongoose.model('Playlist', playlistSchema);