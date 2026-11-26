import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: 'Project Vault Owner',
      maxlength: 100,
    },
    photoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    photoPublicId: {
      type: String,
      trim: true,
      default: '',
    },
    introduction: {
      type: String,
      trim: true,
      default: 'Engineering builder archiving projects, experiments, and technical milestones.',
      maxlength: 600,
    },
    linkedinUrl: {
      type: String,
      trim: true,
      default: '',
    },
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

profileSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Profile = mongoose.model('Profile', profileSchema);
export default Profile;
