import mongoose from 'mongoose';

export const PROJECT_STATUSES = ['Completed', 'In Progress', 'Planned', 'On Hold'];

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: '', trim: true },
    caption: { type: String, default: '', trim: true, maxlength: 200 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    originalFilename: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: '', trim: true },
    resourceType: { type: String, default: 'raw', trim: true },
    bytes: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required.'],
      trim: true,
      maxlength: [140, 'Project name cannot exceed 140 characters.'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    date: {
      type: Date,
      default: null,
    },
    shortDescription: {
      type: String,
      trim: true,
      default: '',
      maxlength: 400,
    },
    detailedDescription: {
      type: String,
      trim: true,
      default: '',
      maxlength: 15000,
    },
    mainLink: {
      type: String,
      trim: true,
      default: '',
    },
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },
    frontendUrl: {
      type: String,
      trim: true,
      default: '',
    },
    backendUrl: {
      type: String,
      trim: true,
      default: '',
    },
    mongoClusterUrl: {
      type: String,
      trim: true,
      default: '',
    },
    technologies: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: PROJECT_STATUSES,
        message: 'Status must be Completed, In Progress, Planned, or On Hold.',
      },
      default: 'Completed',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 8000,
    },
    thumbnail: {
      url: { type: String, trim: true, default: '' },
      publicId: { type: String, trim: true, default: '' },
    },
    screenshots: {
      type: [mediaSchema],
      default: [],
    },
    documents: {
      type: [documentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
