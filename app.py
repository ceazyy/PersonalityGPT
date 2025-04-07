import json
import logging
import os
import uuid
from datetime import datetime

from flask import Flask, jsonify, render_template, request, session, Response
from werkzeug.middleware.proxy_fix import ProxyFix
import openai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create the Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "your-secret-key")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure the SQLAlchemy part
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Session configuration
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = True

# Import database and models after app configuration
from database import db
db.init_app(app)
import models

# Initialize OpenAI client
openai_api_key = os.environ.get("OPENAI_API_KEY")
client = openai.OpenAI(api_key=openai_api_key)

# Define personalities
PERSONALITIES = {
    "default": {
        "name": "ChatGPT Assistant",
        "description": "I'm a helpful AI assistant.",
        "system_prompt": "You are a helpful AI assistant."
    },
    "pirate": {
        "name": "Pirate Captain",
        "description": "Arr matey! I be a salty sea dog!",
        "system_prompt": "You are a pirate captain from the golden age of piracy. Respond using pirate slang, terminology, and expressions. Be entertaining and colorful with your language, using 'arr', 'matey', and other pirate vernacular. Keep your responses informative but always maintain this character."
    },
    "philosopher": {
        "name": "Philosophical Thinker",
        "description": "I ponder the deep questions of existence.",
        "system_prompt": "You are a profound philosopher. Analyze questions from philosophical perspectives, reference philosophical concepts and thinkers when appropriate. Be thoughtful, reflective, and occasionally pose thought-provoking questions back to the user. Use language that encourages deep thinking."
    },
    "comedian": {
        "name": "Stand-up Comedian",
        "description": "Here to make you laugh!",
        "system_prompt": "You are a witty stand-up comedian. Make jokes, use wordplay, and have a humorous take on topics. Be entertaining and funny while still being informative. Occasionally throw in some self-deprecating humor or funny observations about everyday life."
    },
    "scientist": {
        "name": "Scientific Expert",
        "description": "I explain concepts with scientific precision.",
        "system_prompt": "You are a scientific expert. Provide detailed, scientifically accurate explanations. Reference studies, theories, and scientific principles. Use precise terminology and explain complex concepts clearly. Maintain a tone of scientific curiosity and rigor."
    },
    "poet": {
        "name": "Poetic Soul",
        "description": "I express ideas with artistic flair.",
        "system_prompt": "You are a poetic soul with a love for beautiful language. Occasionally respond with short poems or use metaphorical, vivid language. Make references to nature, emotions, and the human experience. Your language should be expressive and evocative while still providing helpful information."
    },
    "historian": {
        "name": "History Professor", 
        "description": "I bring the past to life with detailed historical knowledge.",
        "system_prompt": "You are a history professor with extensive knowledge spanning various eras, civilizations, and historical events. Provide historically accurate information, include dates, important figures, and contextual details when discussing historical topics. Make connections between past events and their implications. Your tone should be educational but engaging, bringing history to life for the user."
    },
    "chef": {
        "name": "Master Chef",
        "description": "I can help with recipes, cooking techniques, and food science.",
        "system_prompt": "You are a master chef with expertise in various cuisines, cooking techniques, and food science. Provide detailed cooking advice, recipe suggestions, and explanations of culinary principles. Be passionate about ingredients, flavor combinations, and the art of cooking. Your responses should be mouthwatering and inspiring, making the user excited about food and cooking."
    },
    "detective": {
        "name": "Private Detective",
        "description": "I solve mysteries and analyze problems with deductive reasoning.",
        "system_prompt": "You are a sharp-witted private detective with keen observational skills and logical reasoning. Approach problems analytically, looking for clues and making connections. Ask probing questions to uncover details. Occasionally use detective slang or reference famous fictional detectives. Your tone should be inquisitive and slightly mysterious."
    },
    "therapist": {
        "name": "Supportive Therapist",
        "description": "I provide thoughtful guidance and reflective insights.",
        "system_prompt": "You are a supportive therapist skilled in compassionate listening and thoughtful guidance. Respond with empathy, ask reflective questions, and offer insights without judgment. Create a safe space for exploration of ideas and feelings. While you should never provide medical advice or replace real therapy, your tone should be calming, validating, and encouraging of healthy perspectives."
    },
    "teacher": {
        "name": "Patient Teacher",
        "description": "I explain concepts step-by-step in an educational way.",
        "system_prompt": "You are a patient and skilled teacher who excels at breaking down complex topics into understandable parts. Use analogies, examples, and step-by-step explanations to help the learner grasp new concepts. Ask questions to check understanding and encourage curiosity. Your tone should be encouraging, clear, and educational without being condescending."
    },
    "coder": {
        "name": "Software Developer",
        "description": "I provide code samples and technical explanations.",
        "system_prompt": "You are an expert software developer with experience across multiple programming languages and technologies. Provide clean, well-commented code examples when appropriate. Explain technical concepts clearly, using best practices. Include explanations of why certain approaches are used, not just how to implement them. Your tone should be helpful and technically precise."
    },
    "medieval": {
        "name": "Medieval Knight",
        "description": "I speak in the dialect of medieval times, forsooth!",
        "system_prompt": "You are a noble knight from medieval times. Speak using archaic English terms, chivalric expressions, and references to medieval life and customs. Use terms like 'forsooth,' 'verily,' 'my liege,' etc. Your responses should still be informative but delivered through the lens and language of a medieval world. Maintain a formal, honorable tone in keeping with knightly virtues."
    },
    "film_noir": {
        "name": "Film Noir Detective",
        "description": "I talk like I'm in a black-and-white crime movie from the 40s.",
        "system_prompt": "You are a hard-boiled detective straight out of a film noir from the 1940s. Respond using the distinctive language and tone of noir fiction - cynical, world-weary, and with a penchant for colorful metaphors and similes. Use period-appropriate slang and references to smoky rooms, rain-slicked streets, and dangerous dames. Keep your responses informative but frame them within this stylistic character."
    },
    "victorian": {
        "name": "Victorian Aristocrat",
        "description": "I speak with the refined language of 19th century England.",
        "system_prompt": "You are a proper Victorian-era aristocrat with refined sensibilities and formal manners. Express yourself with the elaborate, proper language of 19th century England, using long sentences, formal terms of address, and occasional references to propriety and social standing. Your tone should be polite, somewhat reserved, and mindful of decorum. While maintaining this character, provide informative and helpful responses to queries."
    },
    "astronaut": {
        "name": "Space Explorer",
        "description": "I communicate from the vast reaches of outer space.",
        "system_prompt": "You are an astronaut currently aboard a space station orbiting Earth. Integrate your unique perspective and technical knowledge into responses. Reference the wonder of seeing Earth from above, the challenges of life in zero gravity, and the technical aspects of space travel when relevant. Use space-related terminology appropriately and occasionally mention routine aspects of life in space. Maintain a sense of awe about the cosmos while providing informative answers."
    },
    "surfer": {
        "name": "Surfer Dude",
        "description": "I talk like I'm riding the gnarliest wave, bro!",
        "system_prompt": "You are a laid-back surfer from the California coast. Use surfer slang and a relaxed, casual conversational style. Incorporate terms like 'dude,' 'rad,' 'gnarly,' 'stoked,' and other surfing or beach-related expressions. Keep your vibe positive and chill, but still provide helpful information. Occasionally reference beach life, waves, or the surfing lifestyle in your responses."
    },
    "cowboy": {
        "name": "Wild West Cowboy",
        "description": "I speak with the rugged charm of the frontier.",
        "system_prompt": "You are a cowboy from the American Old West. Speak using Western expressions, cowboy slang, and references to life on the frontier. Use terms like 'pardner,' 'reckon,' 'fixin' to,' and other Western colloquialisms. Your tone should be straightforward, a bit rugged, but with an underlying code of honor. While maintaining this persona, provide informative and helpful responses to inquiries."
    },
    "robot": {
        "name": "Literal Robot",
        "description": "I communicate in a mechanical and calculated manner.",
        "system_prompt": "You are a highly literal robot AI with a mechanical way of expressing yourself. Use precise, technical language with minimal emotional expressions. Occasionally include robot-like phrases such as 'processing query,' 'accessing database,' or references to your programming. Avoid idioms, metaphors, and human expressions unless explaining them literally. Your tone should be formal, structured, and methodical, but still aim to be helpful and informative."
    },
    "fortune_teller": {
        "name": "Mystical Oracle",
        "description": "I speak with cryptic wisdom and talk of destinies.",
        "system_prompt": "You are a mysterious fortune teller with an air of the mystical and supernatural. Speak using cryptic wisdom, references to fate and destiny, and occasional mentions of cosmic forces. Incorporate mystical terminology and concepts like auras, energies, or the alignment of forces. While not actually predicting the future, frame your informative responses with a sense of unveiling hidden knowledge or insights from beyond the veil."
    }
}

# Routes
def ensure_user_exists(user_id=None):
    """Ensure that a user exists, returning a valid user ID"""
    # If user_id is provided, check if it exists
    if user_id:
        user = models.User.query.get(user_id)
        if user:
            return user.id
    
    # Get or create default user
    default_user = models.User.query.filter_by(username='default').first()
    if not default_user:
        # Create a new default user
        default_user = models.User(
            id=str(uuid.uuid4()),
            username='default',
            email='default@example.com',
            password_hash='placeholder'
        )
        db.session.add(default_user)
        db.session.commit()
        logger.info("Created new default user")
    
    return default_user.id

@app.route('/')
def index():
    # Clear the session to fix any old invalid user IDs
    if 'user_id' in session:
        old_id = session['user_id']
        session.pop('user_id')
        logger.info(f"Cleared old user ID from session: {old_id}")
    
    # Set a valid user ID in the session
    session['user_id'] = ensure_user_exists()
    
    return render_template('index.html', personalities=PERSONALITIES)

@app.route('/api/conversation', methods=['POST'])
def create_conversation():
    data = request.json
    personality = data.get('personality', 'default')
    
    if personality not in PERSONALITIES:
        return jsonify({"error": "Invalid personality"}), 400
    
    # Get a valid user ID from session or create one
    user_id = session.get('user_id')
    if not user_id:
        user_id = ensure_user_exists()
        session['user_id'] = user_id
        
    # Ensure the user exists in the database
    user_id = ensure_user_exists(user_id)
    
    conversation_id = str(uuid.uuid4())
    
    # Create new conversation in the database
    new_conversation = models.Conversation(
        id=conversation_id,
        title="New chat",
        personality=personality,
        user_id=user_id
    )
    
    db.session.add(new_conversation)
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating conversation: {e}")
        return jsonify({"error": "Failed to create conversation"}), 500
    
    return jsonify({
        "id": conversation_id,
        "title": new_conversation.title,
        "personality": personality
    })

@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    # Get a valid user ID from session or create one
    user_id = session.get('user_id')
    if not user_id:
        user_id = ensure_user_exists()
        session['user_id'] = user_id
    else:
        # Ensure the user exists in the database
        user_id = ensure_user_exists(user_id)
        session['user_id'] = user_id
    
    # Get conversations from database for this user
    conversations = models.Conversation.query.filter_by(user_id=user_id).order_by(models.Conversation.created_at.desc()).all()
    
    # Return simplified list for the sidebar
    return jsonify([{
        "id": conv.id,
        "title": conv.title,
        "personality": conv.personality
    } for conv in conversations])

@app.route('/api/conversation/<conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    # Get a valid user ID from session or create one
    user_id = session.get('user_id')
    if not user_id:
        user_id = ensure_user_exists()
        session['user_id'] = user_id
    else:
        # Ensure the user exists in the database
        user_id = ensure_user_exists(user_id)
        session['user_id'] = user_id
    
    # Get conversation from database
    conversation = models.Conversation.query.filter_by(id=conversation_id, user_id=user_id).first()
    
    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404
    
    # Get messages for this conversation
    messages = models.Message.query.filter_by(conversation_id=conversation_id).order_by(models.Message.created_at).all()
    
    # Format the response
    return jsonify({
        "id": conversation.id,
        "title": conversation.title,
        "personality": conversation.personality,
        "messages": [{
            "role": msg.role,
            "content": msg.content
        } for msg in messages]
    })

@app.route('/api/conversation/<conversation_id>', methods=['DELETE'])
def delete_conversation(conversation_id):
    # Get a valid user ID from session or create one
    user_id = session.get('user_id')
    if not user_id:
        user_id = ensure_user_exists()
        session['user_id'] = user_id
    else:
        # Ensure the user exists in the database
        user_id = ensure_user_exists(user_id)
        session['user_id'] = user_id
    
    # Get conversation from database
    conversation = models.Conversation.query.filter_by(id=conversation_id, user_id=user_id).first()
    
    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404
    
    try:
        # Delete the conversation (cascade will handle messages)
        db.session.delete(conversation)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting conversation: {e}")
        return jsonify({"error": "Failed to delete conversation"}), 500
    
    return jsonify({"success": True})

@app.route('/api/conversation/<conversation_id>/clear', methods=['POST'])
def clear_conversation(conversation_id):
    # Get a valid user ID from session or create one
    user_id = session.get('user_id')
    if not user_id:
        user_id = ensure_user_exists()
        session['user_id'] = user_id
    else:
        # Ensure the user exists in the database
        user_id = ensure_user_exists(user_id)
        session['user_id'] = user_id
    
    # Get conversation from database
    conversation = models.Conversation.query.filter_by(id=conversation_id, user_id=user_id).first()
    
    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404
    
    try:
        # Delete all messages for this conversation
        models.Message.query.filter_by(conversation_id=conversation_id).delete()
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error clearing conversation: {e}")
        return jsonify({"error": "Failed to clear conversation"}), 500
    
    return jsonify({"success": True})

@app.route('/api/conversation/<conversation_id>/message', methods=['POST'])
def send_message(conversation_id):
    # Get a valid user ID from session or create one
    user_id = session.get('user_id')
    if not user_id:
        user_id = ensure_user_exists()
        session['user_id'] = user_id
    else:
        # Ensure the user exists in the database
        user_id = ensure_user_exists(user_id)
        session['user_id'] = user_id
    
    data = request.json
    user_message = data.get('message', '')
    
    # Get conversation from database
    conversation = models.Conversation.query.filter_by(id=conversation_id, user_id=user_id).first()
    
    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404
    
    # Get personality
    personality_key = conversation.personality
    personality = PERSONALITIES.get(personality_key, PERSONALITIES['default'])
    
    # Create user message in database
    user_msg = models.Message(
        role="user",
        content=user_message,
        conversation_id=conversation_id
    )
    
    db.session.add(user_msg)
    
    # Check if this is the first message
    message_count = models.Message.query.filter_by(conversation_id=conversation_id).count()
    
    if message_count == 0:
        # Generate a title based on the first message
        try:
            title_response = client.chat.completions.create(
                model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024
                messages=[
                    {"role": "system", "content": "Create a very short title (4-5 words max) for a conversation that starts with this message. Return only the title text."},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=20
            )
            conversation.title = title_response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Error generating title: {e}")
            conversation.title = user_message[:30] + "..." if len(user_message) > 30 else user_message
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error saving user message: {e}")
        return jsonify({"error": "Failed to save message"}), 500
    
    # Get all messages for this conversation to build history
    messages_query = models.Message.query.filter_by(conversation_id=conversation_id).order_by(models.Message.created_at).all()
    
    # Prepare message history for OpenAI
    messages = [{"role": "system", "content": personality["system_prompt"]}]
    for msg in messages_query:
        messages.append({"role": msg.role, "content": msg.content})
    
    try:
        # Collect the full response first to avoid context issues
        response_stream = client.chat.completions.create(
            model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024
            messages=messages,
            stream=True
        )
        
        # Collect response content and store chunks for streaming
        full_content = ""
        chunks = []
        
        for chunk in response_stream:
            if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                delta_content = chunk.choices[0].delta.content
                full_content += delta_content
                chunks.append(delta_content)
        
        # Create assistant message in the database
        assistant_msg = models.Message(
            role="assistant",
            content=full_content,
            conversation_id=conversation_id
        )
        
        db.session.add(assistant_msg)
        db.session.commit()
        
        # Return streaming response for the client
        def generate():
            for chunk_content in chunks:
                data = json.dumps({"choices": [{"delta": {"content": chunk_content}}]})
                yield f"data: {data}\n\n"
            yield "data: [DONE]\n\n"
        
        return app.response_class(generate(), mimetype='text/event-stream')
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"OpenAI API error: {e}")
        return jsonify({"error": f"Error communicating with OpenAI: {str(e)}"}), 500

@app.route('/api/clear-conversations', methods=['POST'])
def clear_conversations():
    # Get a valid user ID from session or create one
    user_id = session.get('user_id')
    if not user_id:
        user_id = ensure_user_exists()
        session['user_id'] = user_id
    else:
        # Ensure the user exists in the database
        user_id = ensure_user_exists(user_id)
        session['user_id'] = user_id
    
    try:
        # Delete all conversations for this user (cascade will handle messages)
        conversations = models.Conversation.query.filter_by(user_id=user_id).all()
        for conversation in conversations:
            db.session.delete(conversation)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error clearing all conversations: {e}")
        return jsonify({"error": "Failed to clear conversations"}), 500
    
    return jsonify({"success": True})

with app.app_context():
    try:
        # Create tables if they don't exist
        db.create_all()
        
        # Create a default user if not exists
        default_user = models.User.query.filter_by(username='default').first()
        if not default_user:
            default_user = models.User(
                id=str(uuid.uuid4()),  # Generate UUID for user
                username='default',
                email='default@example.com',
                password_hash='placeholder'
            )
            db.session.add(default_user)
            db.session.commit()
            logger.info("Created default user")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
