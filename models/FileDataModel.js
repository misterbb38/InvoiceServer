// // models/FileDataModel.js
// const mongoose = require('mongoose')

// const fileDataSchema = new mongoose.Schema({
//   fileData: [
//     {
//       fileName: {
//         type: String,
//         required: true,
//       },
//       wordCount: {
//         type: Number,
//         required: true,
//       },
//       pageCount: {
//         type: Number,
//         required: true,
//       },
//       priceForWords: {
//         type: Number,
//         required: true,
//       },
//       priceForPages: {
//         type: Number,
//         required: true,
//       },
//     },
//   ],
// })

// const FileData = mongoose.model('FileData', fileDataSchema)
// module.exports = FileData


const mongoose = require('mongoose');

const fileDataSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true,
  },
  totalWordCount: {
    type: Number,
    required: true,
  },
  totalPageCount: {
    type: Number,
    required: true,
  },
  totalPriceForPages: {
    type: Number,
    required: true,
  },
  totalPriceForWords: {
    type: Number,
    required: true,
  },
  fileData: [
    {
      fileName: {
        type: String,
        required: true,
      },
      wordCount: {
        type: Number,
        required: true,
      },
      pageCount: {
        type: Number,
        required: true,
      },
      priceForWords: {
        type: Number,
        required: true,
      },
      priceForPages: {
        type: Number,
        required: true,
      },
    },
  ],
});

const FileData = mongoose.model('FileData', fileDataSchema);
module.exports = FileData;
