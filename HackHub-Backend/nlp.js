// Pure JS lightweight NLP Evaluator for HackHub

// Common stop words to ignore
const STOP_WORDS = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'of', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'it', 'this', 'that']);

const GENERIC_KEYWORDS = ['todo', 'to-do', 'chat', 'calculator', 'weather', 'note', 'crud', 'login', 'blog', 'portfolio'];
const SPECIFIC_TOOLS = ['react', 'angular', 'vue', 'next', 'express', 'django', 'flask', 'fastapi', 'spring', 'postgres', 'postgresql', 'mongodb', 'mysql', 'redis', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'tensorflow', 'pytorch', 'scikit', 'node', 'graphql', 'rest', 'firebase', 'supabase'];

function tokenize(text) {
    if (!text) return [];
    return text.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ') // Replace non-alphanumeric (except hyphens) with space
        .split(/\s+/) // Split by whitespace
        .filter(function(w) { return w.length > 2 && !STOP_WORDS.has(w); }); // Filter short words and stopwords
}

function getWordFrequencies(tokens) {
    const freqs = {};
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        freqs[token] = (freqs[token] || 0) + 1;
    }
    return freqs;
}

function cosineSimilarity(freqsA, freqsB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    const tokensA = Object.keys(freqsA);
    const tokensB = Object.keys(freqsB);
    const uniqueTokens = new Set(tokensA.concat(tokensB));
    
    uniqueTokens.forEach(function(token) {
        const a = freqsA[token] || 0;
        const b = freqsB[token] || 0;
        dotProduct += a * b;
        normA += a * a;
        normB += b * b;
    });
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function scoreInnovation(submissionText, pastSubmissions) {
    if (!pastSubmissions || pastSubmissions.length === 0) {
        return 7.5; // Default for first submission
    }

    const subTokens = tokenize(submissionText);
    const subFreqs = getWordFrequencies(subTokens);
    
    let maxSim = 0;
    for (var i = 0; i < pastSubmissions.length; i++) {
        var past = pastSubmissions[i];
        const pastFreqs = getWordFrequencies(tokenize(past));
        const sim = cosineSimilarity(subFreqs, pastFreqs);
        if (sim > maxSim) maxSim = sim;
    }

    let score = (1 - maxSim) * 10;
    
    // Penalize generic ideas
    const lowerText = submissionText.toLowerCase();
    for (var j = 0; j < GENERIC_KEYWORDS.length; j++) {
        var kw = GENERIC_KEYWORDS[j];
        if (lowerText.indexOf(kw) !== -1) {
            score -= 1.5;
            break;
        }
    }
    return Math.max(0, Math.min(10, score));
}

function scoreFeasibility(submission) {
    let score = 5.0; // Base score
    
    const techStack = submission.tech_stack || '';
    if (techStack.length > 0) score += 2.0;
    
    const solution = submission.proposed_solution || '';
    if (solution.length > 100) score += 1.5;
    
    const problem = submission.problem_statement || '';
    if (problem.length > 50) score += 1.5;
    
    const allText = (techStack + ' ' + solution).toLowerCase();
    const hasSpecificTool = SPECIFIC_TOOLS.some(function(tool) { return allText.indexOf(tool) !== -1; });
    if (hasSpecificTool) score += 0.5;
    
    if (problem.length > 0 && solution.length > 0) score += 0.5;

    return Math.max(0, Math.min(10, score));
}

function scoreRelevance(submissionText, theme) {
    if (!theme) return 7.0; // Default if no theme

    const subFreqs = getWordFrequencies(tokenize(submissionText));
    const themeFreqs = getWordFrequencies(tokenize(theme));
    
    const sim = cosineSimilarity(subFreqs, themeFreqs);
    // Amplify similarity as theme matching is usually high or low
    return Math.max(0, Math.min(10, sim * 12));
}

function scoreClarity(submissionText, submission) {
    if (!submissionText || submissionText.length < 10) return 1.0;

    // Simplified readability heuristic
    const words = submissionText.split(/\s+/).length;
    const sentences = (submissionText.match(/[.!?]/g) || []).length || 1;
    const wordsPerSentence = words / sentences;
    
    // Ideal is 10-15 words per sentence. Over 25 is too complex.
    let baseScore = 10;
    if (wordsPerSentence > 25) baseScore -= 3;
    else if (wordsPerSentence > 20) baseScore -= 1.5;
    
    let bonus = 0;
    if (submission.problem_statement && submission.proposed_solution) bonus += 1.0;
    if (submissionText.length > 200) bonus += 0.5;
    
    return Math.max(0, Math.min(10, baseScore + bonus));
}

function generateFeedback(inn, feas, rel, clar) {
    const parts = [];
    if (inn >= 7) parts.push("Strong innovation — your idea stands out.");
    else parts.push("Consider making your idea more unique compared to existing solutions.");
    
    if (feas < 6) parts.push("Improve feasibility by detailing your technical approach and stack.");
    
    if (rel >= 7) parts.push("Great relevance to the hackathon theme.");
    else parts.push("Try aligning your idea closer to the core theme.");
    
    if (clar < 6) parts.push("Improve clarity by using structured sections and clear sentences.");
    
    return parts.join(" ");
}

/**
 * Main evaluation function
 * @param {Object} submission - The submission object
 * @param {Array} pastSubmissionsText - Array of string texts of past submissions
 * @param {String} hackathonTheme - The hackathon theme description
 * @returns {Object} Score breakdown and feedback
 */
function evaluateIdea(submission, pastSubmissionsText, hackathonTheme) {
    // Replaced template literals with standard string concatenation for compatibility
    const combinedText = (submission.title || '') + " " + (submission.idea_description || '') + " " + (submission.proposed_solution || '');
    
    const innovation = scoreInnovation(combinedText, pastSubmissionsText);
    const feasibility = scoreFeasibility(submission);
    const relevance = scoreRelevance(combinedText, hackathonTheme);
    const clarity = scoreClarity(combinedText, submission);
    
    // Weights: Innovation 30%, Feasibility 25%, Relevance 25%, Clarity 20%
    const overall = (innovation * 0.30) + (feasibility * 0.25) + (relevance * 0.25) + (clarity * 0.20);
    
    const feedback = generateFeedback(innovation, feasibility, relevance, clarity);
    
    return {
        innovation_score: parseFloat(innovation.toFixed(2)),
        feasibility_score: parseFloat(feasibility.toFixed(2)),
        relevance_score: parseFloat(relevance.toFixed(2)),
        clarity_score: parseFloat(clarity.toFixed(2)),
        overall_score: parseFloat(overall.toFixed(2)),
        feedback: feedback
    };
}

module.exports = {
    evaluateIdea: evaluateIdea
};
