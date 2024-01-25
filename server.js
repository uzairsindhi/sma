// express server.js
const express = require('express');
const mongoose = require('mongoose');
const sharp = require('sharp'); //for server side image compression
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Students', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a Mongoose Schema for the student data
const studentSchema = new mongoose.Schema({
  fullName: String,
  fatherName: String,
  caste: String,
  religon: String,
  dateOfBirth: Date,
  nic: Number,
  gender: String,
  markOfIdentification: String,
  class: String,
  contactNumber: String,
  email: String,
  address: String,
  lastSchoolAttended: String,
  dateOfFormSubmission: Date,
  dateOfAdmission: Date,
  grNo: { type: Number, unique: true },
  rollNo: {type: Number, unique: true },
  photo: { type: String },
});

// Create a model for the student data
const Student = mongoose.model('Student', studentSchema);



// Middleware to parse JSON
app.use(express.json({ limit: '50mb' }));





//API for Search Component Starts
app.get('/api/search/:searchQuery', async (req, res) => {
  try {
    const searchQuery = req.params.searchQuery;

    console.log('Received Search Query:', searchQuery);

    // Use the `db.listCollections()` method to get a list of all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();

    // Array to store search results
    const searchResults = [];

    // Iterate through collections and search for the student in each collection
    for (const collection of collections) {
      const collectionName = collection.name;

      console.log('Checking Collection:', collectionName);

      // Use the current collection name to dynamically select the collection
      const classCollection = mongoose.connection.db.collection(collectionName);

      // Determine if the search query is numeric
      const isNumeric = !isNaN(searchQuery);

      // Search for the students in the current collection based on the search query
      const students = await classCollection.find({
        $or: [
          { _id: { $regex: new RegExp(searchQuery, 'i') } },
          { fullName: { $regex: new RegExp(searchQuery, 'i') } },  // String
          { fatherName: { $regex: new RegExp(searchQuery, 'i') } },  // String
          { caste: { $regex: new RegExp(searchQuery, 'i') } },        // String
          { religon: { $regex: new RegExp(searchQuery, 'i') } },      // String
          { dateOfBirth: new Date(searchQuery) },                     // Date
          { nic: isNumeric ? parseInt(searchQuery) : searchQuery },   // Number
          { gender: { $regex: new RegExp(searchQuery, 'i') } },       // String
          { markOfIdentification: { $regex: new RegExp(searchQuery, 'i') } },  // String
          { class: { $regex: new RegExp(searchQuery, 'i') } },        // String
          { contactNumber: { $regex: new RegExp(searchQuery, 'i') } }, // String
          { email: { $regex: new RegExp(searchQuery, 'i') } },        // String
          { address: { $regex: new RegExp(searchQuery, 'i') } },      // String
          { lastSchoolAttended: { $regex: new RegExp(searchQuery, 'i') } },  // String
          { dateOfFormSubmission: new Date(searchQuery) },            // Date
          { dateOfAdmission: new Date(searchQuery) },                 // Date
          { grNo: isNumeric ? parseInt(searchQuery) : searchQuery },   // Number
          { rollNo: isNumeric ? parseInt(searchQuery) : searchQuery },   // Number
          { nic: isNumeric ? parseInt(searchQuery) : searchQuery },   // Number
          // Add other fields as needed
        ],
      }).toArray();
      

      // If students are found, add them to the search results array
      if (students.length > 0) {
        searchResults.push(...students);
        console.log('this is student data _id:', students._id);
      }
    }

    console.log('Search Results:', typeof searchResults);

    // Send the search results in the response
    res.json(searchResults);
  } catch (error) {
    console.error('Error searching for student data:', error);
    res.status(500).send('Internal Server Error');
  }
});

//API for Search Component Ends




// Delete records based on GR and Roll Numbers
app.post('/api/students/delete/:class', async (req, res) => {
  try {
    const { grNumbers, rollNumbers } = req.body;
    const className = req.params.class;

    // Log the received GR and Roll Numbers
    console.log('Received G.R Numbers:', grNumbers);
    console.log('Received Roll Numbers:', rollNumbers);

    // Use the class name to dynamically select the corresponding collection
    const classCollection = mongoose.connection.db.collection(className);


    
    // Delete the selected records
    const deleteResult = await classCollection.deleteMany({
      $or: [
        { grNo: { $in: grNumbers } },
        { rollNo: { $in: rollNumbers } },
      ],
    });

    // Send a success response
    res.json({ success: true });
    console.log('deleteResult:', deleteResult);
  } catch (error) {
    console.error('Error deleting records:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Delete Route Ends Here







// update code starts
// Updated API endpoint to update a student's data
// API endpoint to fetch a student based on G.R number across all collections
// API for fetching data with GR Number or Roll Number
app.get('/api/students/:identifier', async (req, res) => {
  try {
    const identifier = req.params.identifier;

    // Convert identifier to a number (if it's a numeric string)
    const identifierNumeric = isNaN(identifier) ? identifier : parseInt(identifier);

    // Use the `db.listCollections()` method to get a list of all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();

    // Iterate through collections and search for the student in each collection
    for (const collection of collections) {
      const collectionName = collection.name;

      // Use the current collection name to dynamically select the collection
      const classCollection = mongoose.connection.db.collection(collectionName);

      // Search for the student in the current collection
      const student = await classCollection.findOne({ $or: [{ grNo: identifierNumeric }, { rollNo: identifierNumeric }] });

      // If student is found, send the data in the response
      if (student) {
        return res.json(student);
      }
    }

    // If no student is found in any collection, send an empty response
    res.status(404).json({ error: 'Student not found' });
  } catch (error) {
    console.error('Error fetching student data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




//Put Request for data Updation
app.put('/api/students/:identifier', async (req, res) => {
  try {
    const identifier = req.params.identifier;

    // Convert identifier to a number (if it's a numeric string)
    const identifierNumeric = isNaN(identifier) ? identifier : parseInt(identifier);

    // Use the `db.listCollections()` method to get a list of all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();

    // Iterate through collections and search for the student in each collection
    for (const collection of collections) {
      const collectionName = collection.name;

      // Use the current collection name to dynamically select the collection
      const classCollection = mongoose.connection.db.collection(collectionName);

      // Search for the student in the current collection
      const student = await classCollection.findOne({
        $or: [{ grNo: identifierNumeric }, { rollNo: identifierNumeric }],
      });

      // If student is found, update the data and send the updated data in the response
      if (student) {
        const result = await classCollection.updateOne(
          { $or: [{ grNo: identifierNumeric }, { rollNo: identifierNumeric }] },
          { $set: req.body }
        );

        // Check if the update was successful
        if (result.modifiedCount > 0) {
          // Fetch the updated data
          const updatedStudent = await classCollection.findOne({
            $or: [{ grNo: identifierNumeric }, { rollNo: identifierNumeric }],
          });

          return res.json(updatedStudent);
        } else {
          return res.status(500).json({ error: 'Update failed' });
        }
      }
    }

    // If no student is found in any collection, send an empty response
    res.status(404).json({ error: 'Student not found' });
  } catch (error) {
    console.error('Error updating student data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// update code ends



// Middleware to compress and resize images using sharp
const compressAndResizeImage = async (req, res, next) => {
  try {
    if (req.body.photo) {
      // Convert the base64 image to a Buffer
      const imageBuffer = Buffer.from(req.body.photo, 'base64');

      // Check if the image format is supported
      const supportedFormats = ['jpeg', 'png', 'gif', 'webp'];
      const metadata = await sharp(imageBuffer).metadata();

      console.log('Image Metadata:', metadata);

      if (!metadata || !metadata.format || !supportedFormats.includes(metadata.format.toLowerCase())) {
        console.error('Unsupported image format:', metadata);
        throw new Error('Unsupported image format');
      }

      // Compress and resize the image
      const compressedImageBuffer = await sharp(imageBuffer)
        .resize({ width: 300, height: 300 }) // Adjust the size as needed
        .jpeg({ quality: 80 }) // Adjust the quality as needed
        .toBuffer();

      // Convert the compressed image to base64
      const compressedBase64Image = compressedImageBuffer.toString('base64');

      // Update the request body with the compressed image
      req.body.photo = compressedBase64Image;

      // Continue with the next middleware
      next();
    } else {
      // If no photo in the request body, continue with the next middleware
      next();
    }
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).send('Internal Server Error');
  }
};






// Route handler for form submissions and checking G.R number uniqueness

app.post('/api/students/:class', compressAndResizeImage, async (req, res) => {
  try {
    const formData = req.body;
    console.log('Received form data:', typeof formData, formData);

    // Check if the G.R number already exists
    const grNumberExists = await Student.exists({ grNo: formData.grNo });

    if (grNumberExists) {
      // Return an error response if G.R number is not unique
      return res.status(400).send('Error: G.R number must be unique for each student.');
    }

    // Determine the class selected in the form
    const selectedClass = formData.class;

    // Use the class name to dynamically select the corresponding collection
    const classCollection = mongoose.connection.db.collection(`${selectedClass}`);

    // Check if the class collection already exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const isClassCollectionExists = collections.some(collection => collection.name === selectedClass);

    if (!isClassCollectionExists) {
      // If the class collection doesn't exist, create a new one
      await classCollection.createIndex({ grNo: 1 }, { unique: true });
    }



    // Save the form data to the respective class collection
    await classCollection.insertOne(formData);

    res.status(200).send('Form data received and saved successfully');
  } catch (error) {
    console.error('Error processing form data:', error);
    res.status(500).send('Internal Server Error');
  }
});



// Fetch Data based on class name starts Here
app.get('/api/students/class/:className', async (req, res) => {
  try {
    const className = req.params.className;

    // Use the class name to dynamically select the corresponding collection
    const classCollection = mongoose.connection.db.collection(className);

    // Fetch all students from the specified class collection
    const students = await classCollection.find().toArray();

    res.json(students);
  } catch (error) {
    console.error('Error fetching student data based on class:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Fetch Data based on Class name ends Here




// API endpoint to fetch all students from a specific class
//http://127.0.0.1:3001/api/students/Class%20VI
/* */
app.get('/api/students/:class', async (req, res) => {
  try {
    const selectedClass = req.params.class;

    // Use the class name to dynamically select the corresponding collection
    const classCollection = mongoose.connection.db.collection(`${selectedClass}`);

    // Fetch all students from the specified class collection
    const students = await classCollection.find().toArray();

    res.json(students);
  } catch (error) {
    console.error('Error fetching student data:', error);
    res.status(500).send('Internal Server Error');
  }
});




// API endpoint to fetch a student based on G.R number across all collections
// API to fetch Student Based on its GR number

app.get('/api/students/:grNo', async (req, res) => {
  try {
    const grNo = req.params.grNo;

    // Use the `db.listCollections()` method to get a list of all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();

    // Iterate through collections and search for the student in each collection
    for (const collection of collections) {
      const collectionName = collection.name;

      // Use the current collection name to dynamically select the collection
      const classCollection = mongoose.connection.db.collection(collectionName);

      // Search for the student in the current collection
      const student = await classCollection.findOne({ grNo });

      // If student is found, send the data in the response
      if (student) {
        return res.json(student);
      }
    }

    // If no student is found in any collection, send an empty response
    res.json(null);
  } catch (error) {
    console.error('Error fetching student data:', error);
    res.status(500).send('Internal Server Error');
  }
});

//GR finding route ends here







// Default route
app.get('/', (req, res) => {
  res.send('Server is Running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});