import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new Schema({
    videoFile: {
        type: String, // URL or path to the video file 
        required: true
    },
    thumbnail: {
        type: String, // URL or path to the thumbnail image
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User' // References the 'User' model we created previously
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number, // Duration in seconds
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true 
});

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model('Video', videoSchema);   