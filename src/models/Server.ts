import mongoose from 'mongoose';

const ServerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  host: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
  },
  isLocal: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export default mongoose.models.Server || mongoose.model('Server', ServerSchema);
