# PersonalityGPT

![PersonalityGPT Logo](./generated-icon.png)

A dynamic, interactive ChatGPT interface powered by OpenAI's GPT-4o, enabling users to engage with AI through customizable personalities and intuitive conversational experiences.

## Features

- **Multiple AI Personalities**: Choose from 20 different personas including Pirate Captain, Philosopher, Comedian, Scientist, and more
- **OpenAI-Style Interface**: Clean, minimalist design inspired by OpenAI's ChatGPT interface
- **Real-time Streaming Responses**: See AI responses appear in real-time as they're generated
- **Conversation Management**: Create, view, and delete conversations with ease
- **Message History**: All conversations are saved to a database for persistent access
- **Markdown Support**: AI responses support full markdown formatting including code blocks
- **Mobile-Friendly Design**: Responsive layout works across all device sizes

## Technology Stack

- **Backend**: Flask (Python) with SQLAlchemy ORM
- **Database**: PostgreSQL for reliable data storage
- **AI Integration**: OpenAI's GPT-4o model for state-of-the-art responses
- **Frontend**: Vanilla JavaScript, HTML5, and CSS3 (no framework dependencies)
- **Authentication**: Simple user session management with Flask-Login
- **Real-time Updates**: Server-Sent Events (SSE) for streaming responses

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL database
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/personality-gpt.git
cd personality-gpt
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set environment variables:
```bash
export FLASK_APP=main.py
export FLASK_ENV=development
export OPENAI_API_KEY=your_openai_api_key
export DATABASE_URL=postgresql://username:password@localhost/personality_gpt
export SESSION_SECRET=your_secret_key
```

4. Initialize the database:
```bash
flask db init
flask db migrate
flask db upgrade
```

5. Run the application:
```bash
python main.py
```

The application will be available at `http://localhost:5000`.

## Usage

1. **Choose a Personality**: Select from the personality grid on the welcome screen
2. **Start a Conversation**: Click on a personality card to begin a new chat
3. **Send Messages**: Type your message and press Enter or click the send button
4. **Manage Conversations**: Use the sidebar to switch between different chats
5. **Delete Conversations**: Click the "Delete current chat" button to remove a conversation

## Available Personalities

- 🤖 **ChatGPT Assistant**: Default helpful AI assistant
- 🏴‍☠️ **Pirate Captain**: Responds with pirate slang and seafaring terminology
- 🧠 **Philosophical Thinker**: Analyzes questions from philosophical perspectives
- 🎭 **Stand-up Comedian**: Provides humorous takes on various topics
- 🔬 **Scientific Expert**: Gives detailed, scientifically accurate explanations
- 📝 **Poetic Soul**: Expresses ideas with artistic flair and occasional poetry
- 📚 **History Professor**: Brings the past to life with historical knowledge
- 🍳 **Master Chef**: Offers cooking advice and culinary expertise
- 🔍 **Private Detective**: Analyzes problems with deductive reasoning
- 💭 **Supportive Therapist**: Provides thoughtful guidance and reflective insights

Plus 10 more unique personalities to choose from!

## Project Structure

```
├── app.py            # Main application logic and API routes
├── database.py       # Database connection setup
├── main.py           # Application entry point
├── models.py         # SQLAlchemy models
├── static/           # Static files
│   ├── css/          # Stylesheets
│   └── js/           # JavaScript files
└── templates/        # HTML templates
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the GPT-4o API
- Flask and SQLAlchemy communities for excellent documentation
- Feather Icons for the beautiful SVG icons used throughout the interface
