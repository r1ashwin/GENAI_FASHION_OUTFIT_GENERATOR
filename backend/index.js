import { Configuration, OpenAIApi } from "openai";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import readline from "readline";

const app = express();
const port = 8000;
app.use(bodyParser.json());
app.use(cors());

const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);

// Function to get user input from the terminal
const getUserInput = async (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

let selectedUser = "";

// Ask for user input to select a user
const selectUser = async () => {
  selectedUser = await getUserInput("Select user (1 for Mohit or 2 for Janvi): ");
};

// Call the function to select user once the server starts
selectUser();

const systemMessage = "you are an AI fashion outfit generator, you need to recommend outfits by politely interacting with the user. Make sure to say namaste and welcome to Flipkart to every user who interacts once.";

app.post("/", async (request, response) => {
  const { chats, generateKeywords } = request.body;

  const userKey = selectedUser === "2" ? "user2" : "user1";
  const currentUser = userProfiles[userKey];

  // Generate preferences string using user data
  const preferences = `The user you are interacting with is ${currentUser.name}. ${currentUser.sex === "male" ? "He" : "She"} is ${currentUser.age} years old, wears ${currentUser.size} size clothing, and ${currentUser.sex === "male" ? "he" : "she"} prefers ${currentUser.preference}.`;

  let messages = [
    {
      role: "system",
      content: systemMessage + " " + preferences,
    },
    ...chats,
  ];

  if (generateKeywords) {
    messages.unshift({
      role: "system",
      content: "you are a fashion keyword generator. Provide keywords related to fashion based on the given input.",
    });
  }

  const result = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: messages,
  });

  const generatedOutput = result.data.choices[0].message.content;

  // Find matching products and keywords
  const matchingProducts = findMatchingProducts(generatedOutput);

  // Attach image URLs to matching products
  const matchingProductsWithImages = matchingProducts.map(productName => {
    const product = productDatabase.find(p => p.name === productName);
    return {
      name: product.name,
      images: product.images,
    };
  });

  // Display keywords and matching products in terminal
  console.log("Generated Keywords:", generatedOutput);
  console.log("Matching Products:", matchingProductsWithImages);

  // Send generatedOutput and matchingProducts to the frontend
  response.json({
    output: result.data.choices[0].message,
    matchingProducts: matchingProductsWithImages,
  });
});

// Static user database
const userProfiles = {
  user1: {
    name: "Mohit",
    sex: "male",
    age: 30,
    size: "XXXL",
    preference: "only wearing red color formals and nothing else",
  },
  user2: {
    name: "Janvi",
    sex: "female",
    age: 28,
    size: "XS",
    preference: "casual wear with vibrant colors but hates pink",
  },
  // Add more user profiles as needed
};

// Statically typed product database with keywords and images
const productDatabase = [
  // Your product data here
];

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
