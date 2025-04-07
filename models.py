from datetime import datetime
from flask_login import UserMixin
from database import db

class User(UserMixin, db.Model):
    id = db.Column(db.String(36), primary_key=True)  # Changed from Integer to String
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    conversations = db.relationship('Conversation', backref='user', lazy=True, cascade="all, delete-orphan")
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

class Conversation(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    personality = db.Column(db.String(50), nullable=False, default='default')
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)  # Added proper foreign key
    messages = db.relationship('Message', backref='conversation', lazy=True, cascade="all, delete-orphan")

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    conversation_id = db.Column(db.String(36), db.ForeignKey('conversation.id'), nullable=False)