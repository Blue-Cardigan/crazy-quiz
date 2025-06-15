-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create custom types
CREATE TYPE quiz_type AS ENUM ('multiple_choice', 'true_false', 'short_answer', 'mixed');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer');

-- Quizzes table
CREATE TABLE quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_published BOOLEAN DEFAULT FALSE,
    quiz_type quiz_type NOT NULL DEFAULT 'mixed'
);

-- Questions table
CREATE TABLE questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answer options table (for multiple choice and true/false questions)
CREATE TABLE answer_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    order_index INTEGER NOT NULL
);

-- Quiz responses table (stores completed quiz attempts)
CREATE TABLE quiz_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual question responses
CREATE TABLE question_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    response_id UUID REFERENCES quiz_responses(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    selected_answer TEXT,
    is_correct BOOLEAN NOT NULL
);

-- Enable RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Quizzes: Users can read published quizzes, and manage their own quizzes
CREATE POLICY "Public quizzes are viewable by everyone" ON quizzes
    FOR SELECT USING (is_published = true);

CREATE POLICY "Users can insert their own quizzes" ON quizzes
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own quizzes" ON quizzes
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own quizzes" ON quizzes
    FOR DELETE USING (auth.uid() = created_by);

-- Questions: Accessible based on quiz access
CREATE POLICY "Questions are viewable if quiz is accessible" ON questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quizzes 
            WHERE quizzes.id = questions.quiz_id 
            AND (quizzes.is_published = true OR quizzes.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can manage questions for their quizzes" ON questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM quizzes 
            WHERE quizzes.id = questions.quiz_id 
            AND quizzes.created_by = auth.uid()
        )
    );

-- Answer options: Accessible based on question access
CREATE POLICY "Answer options are viewable if question is accessible" ON answer_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM questions 
            JOIN quizzes ON quizzes.id = questions.quiz_id
            WHERE questions.id = answer_options.question_id 
            AND (quizzes.is_published = true OR quizzes.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can manage answer options for their questions" ON answer_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM questions 
            JOIN quizzes ON quizzes.id = questions.quiz_id
            WHERE questions.id = answer_options.question_id 
            AND quizzes.created_by = auth.uid()
        )
    );

-- Quiz responses: Users can view their own responses, quiz owners can view all responses
CREATE POLICY "Users can view their own responses" ON quiz_responses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Quiz owners can view all responses to their quizzes" ON quiz_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quizzes 
            WHERE quizzes.id = quiz_responses.quiz_id 
            AND quizzes.created_by = auth.uid()
        )
    );

CREATE POLICY "Anyone can insert quiz responses" ON quiz_responses
    FOR INSERT WITH CHECK (true);

-- Question responses: Same as quiz responses
CREATE POLICY "Users can view their own question responses" ON question_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quiz_responses 
            WHERE quiz_responses.id = question_responses.response_id 
            AND quiz_responses.user_id = auth.uid()
        )
    );

CREATE POLICY "Quiz owners can view question responses to their quizzes" ON question_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quiz_responses 
            JOIN quizzes ON quizzes.id = quiz_responses.quiz_id
            WHERE quiz_responses.id = question_responses.response_id 
            AND quizzes.created_by = auth.uid()
        )
    );

CREATE POLICY "Anyone can insert question responses" ON question_responses
    FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_quizzes_published ON quizzes(is_published);
CREATE INDEX idx_quizzes_created_by ON quizzes(created_by);
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_questions_order ON questions(quiz_id, order_index);
CREATE INDEX idx_answer_options_question_id ON answer_options(question_id);
CREATE INDEX idx_quiz_responses_quiz_id ON quiz_responses(quiz_id);
CREATE INDEX idx_quiz_responses_user_id ON quiz_responses(user_id);
CREATE INDEX idx_question_responses_response_id ON question_responses(response_id); 