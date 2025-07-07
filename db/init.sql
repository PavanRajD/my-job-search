CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100)
);

INSERT INTO users (name) VALUES ('Alice'), ('Bob');

-- Create enum for question categories
CREATE TYPE question_category AS ENUM (
  'Teamwork',
  'Leadership', 
  'Conflict Resolution',
  'Adaptability',
  'Time Management',
  'Communication',
  'Problem Solving',
  'Decision Making',
  'Stress Management',
  'Creativity and Innovation'
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  category question_category NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_answers table
CREATE TABLE IF NOT EXISTS user_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  category question_category NOT NULL,
  session_id TEXT DEFAULT 'default_session',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT DEFAULT 'default_session' UNIQUE,
  total_questions INTEGER DEFAULT 0,
  answered_questions INTEGER DEFAULT 0,
  categories_practiced TEXT[] DEFAULT '{}',
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_meta table
CREATE TABLE IF NOT EXISTS user_meta (
  key TEXT PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Function to update the updated_at column on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on row update
DROP TRIGGER IF EXISTS update_user_answers_updated_at ON user_answers;
CREATE TRIGGER update_user_answers_updated_at
BEFORE UPDATE ON user_answers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_meta_updated_at ON user_meta;
CREATE TRIGGER update_user_meta_updated_at
BEFORE UPDATE ON user_meta
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();