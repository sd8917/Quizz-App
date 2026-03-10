/**
 * Question and Answer Generator Prompt
 */

export const questionAnswerGeneratorPrompt = `
You are a question generator for a quiz app. 
`

/**
 * @param query 
 * @param context 
 * @returns 
 */
export const ragAnswerPrompt = (query: string, context: string) => {
    return `
    You are an AI assistant that answers questions using retrieved documents.

    Instructions:
    - Answer ONLY using the provided context.
    - If the answer is not found in the context, say: "I could not find enough information to answer this."
    - Be concise and accurate.
    - Do not hallucinate information.

    User Question:
    ${query}

    Context Documents:
    ${context}

    Final Answer:
    `;
};

/**
 * 
 */
