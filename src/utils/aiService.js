const personalities = {
  friendly: {
    systemPrompt: "You are a friendly and helpful AI assistant. You're warm, empathetic, and always eager to help. Use a casual, conversational tone.",
    greeting: "Hey there! I'm your friendly AI assistant. How can I help you today? 😊"
  },
  professional: {
    systemPrompt: "You are a professional AI assistant. You provide clear, concise, and well-structured responses. You maintain a formal yet approachable tone.",
    greeting: "Good day. I'm your professional AI assistant. How may I assist you today?"
  },
  technical: {
    systemPrompt: "You are a technical AI assistant specializing in programming and technology. You provide detailed technical explanations with code examples when relevant.",
    greeting: "Hello! I'm your technical AI assistant. Ready to dive into some code or tech discussions?"
  },
  creative: {
    systemPrompt: "You are a creative AI assistant. You think outside the box, provide innovative solutions, and express yourself in imaginative ways.",
    greeting: "✨ Greetings, creative soul! I'm here to spark ideas and explore possibilities with you!"
  }
};

const programmingResponses = {
  keywords: ['code', 'program', 'function', 'bug', 'debug', 'syntax', 'algorithm', 'javascript', 'python', 'react', 'css', 'html'],
  responses: [
    "Great question! Let me help you with that code. {topic} is an important concept in programming.",
    "I'd be happy to help you debug that! Can you share more details about the error you're seeing?",
    "For {topic}, here's what you need to know: It's commonly used in modern development for...",
    "Let's break down {topic} step by step. First, you'll want to understand the fundamentals..."
  ]
};

const taskResponses = {
  keywords: ['remind', 'task', 'todo', 'schedule', 'meeting', 'deadline', 'plan'],
  responses: [
    "I can help you with that! I've noted down: '{task}'. Would you like me to set a reminder?",
    "Got it! I'll help you remember '{task}'. When would you like to be reminded?",
    "Task noted: '{task}'. I can help you organize this better if you'd like!",
    "I've captured that task for you. '{task}' - Let me know if you need help breaking it down into steps."
  ]
};

const generalResponses = {
  greetings: ['hello', 'hi', 'hey', 'greetings'],
  responses: {
    greeting: ["Hello! How can I assist you today?", "Hi there! What can I help you with?", "Hey! Ready to chat?"],
    farewell: ["Goodbye! Feel free to return anytime!", "See you later! Have a great day!", "Take care! I'm here whenever you need me."],
    thanks: ["You're welcome! Happy to help!", "My pleasure! Let me know if you need anything else.", "Glad I could help!"],
    help: [
      "I can help you with:\n• Programming questions and debugging\n• Daily tasks and reminders\n• General knowledge and advice\n• Creative ideas and brainstorming",
      "I'm here to assist with coding, planning tasks, answering questions, and more! What do you need?",
      "Ask me about programming, set up tasks and reminders, or just chat - I'm here for it all!"
    ]
  }
};

export const getAIResponse = async (message, personality = 'friendly', conversationHistory = []) => {
  const lowerMessage = message.toLowerCase();

  if (generalResponses.greetings.some(word => lowerMessage.includes(word))) {
    return personalities[personality].greeting;
  }

  if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
    return generalResponses.responses.farewell[Math.floor(Math.random() * generalResponses.responses.farewell.length)];
  }

  if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    return generalResponses.responses.thanks[Math.floor(Math.random() * generalResponses.responses.thanks.length)];
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return generalResponses.responses.help[Math.floor(Math.random() * generalResponses.responses.help.length)];
  }

  if (programmingResponses.keywords.some(keyword => lowerMessage.includes(keyword))) {
    const matchedKeyword = programmingResponses.keywords.find(keyword => lowerMessage.includes(keyword));
    const response = programmingResponses.responses[Math.floor(Math.random() * programmingResponses.responses.length)];
    return response.replace('{topic}', matchedKeyword || 'that');
  }

  if (taskResponses.keywords.some(keyword => lowerMessage.includes(keyword))) {
    const response = taskResponses.responses[Math.floor(Math.random() * taskResponses.responses.length)];
    return response.replace('{task}', message);
  }

  const contextResponses = {
    friendly: [
      "That's an interesting question! Based on what you're asking, I think...",
      "I love chatting about this! Here's my take: ",
      "Great point! Let me share my thoughts on that.",
      "Hmm, interesting! I'd say that..."
    ],
    professional: [
      "Based on the information provided, I would recommend...",
      "Let me provide a structured response to your query:",
      "In professional terms, the answer would be:",
      "Allow me to address your question systematically:"
    ],
    technical: [
      "From a technical perspective, here's what's happening:",
      "Let me break down the technical details for you:",
      "Technical explanation: ",
      "Looking at this from an engineering standpoint:"
    ],
    creative: [
      "Oh, what a fascinating thought! Here's a creative take:",
      "Let's think outside the box here! ",
      "Imagine this: ",
      "Here's a unique perspective on that:"
    ]
  };

  const personalityResponses = contextResponses[personality] || contextResponses.friendly;
  const randomResponse = personalityResponses[Math.floor(Math.random() * personalityResponses.length)];

  return randomResponse + " I'm here to help you explore this topic further. What specific aspect interests you most?";
};

export const detectCodeBlock = (message) => {
  const codePatterns = [
    /```[\s\S]*?```/g,
    /`[^`]+`/g,
    /function\s+\w+/g,
    /const\s+\w+\s*=/g,
    /let\s+\w+\s*=/g,
    /class\s+\w+/g
  ];

  return codePatterns.some(pattern => pattern.test(message));
};

export const detectTask = (message) => {
  const taskPatterns = [
    /remind me to/i,
    /don't forget/i,
    /need to/i,
    /have to/i,
    /task:/i,
    /todo:/i
  ];

  return taskPatterns.some(pattern => pattern.test(message));
};

export const extractTask = (message) => {
  const taskPatterns = [
    { pattern: /remind me to (.+)/i, index: 1 },
    { pattern: /don't forget to (.+)/i, index: 1 },
    { pattern: /need to (.+)/i, index: 1 },
    { pattern: /have to (.+)/i, index: 1 },
    { pattern: /task: (.+)/i, index: 1 },
    { pattern: /todo: (.+)/i, index: 1 }
  ];

  for (const { pattern, index } of taskPatterns) {
    const match = message.match(pattern);
    if (match) {
      return match[index].trim();
    }
  }

  return null;
};