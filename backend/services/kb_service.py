import boto3
import os
from dotenv import load_dotenv

load_dotenv()

# Bedrock Knowledge Base
kb_client = boto3.client(
    "bedrock-agent-runtime",
    region_name=os.getenv("AWS_REGION"),
)

# Bedrock Runtime untuk generate answer
model_client = boto3.client(
    "bedrock-runtime",
    region_name=os.getenv("AWS_REGION"),
)

KB_ID = os.getenv("KNOWLEDGE_BASE_ID")
MODEL_ID = os.getenv("KNOWLEDGE_BASE_MODEL_ARN")


def ask_knowledge_base(question: str):

    # 1. Retrieve relevant information from Knowledge Base
    response = kb_client.retrieve(
        knowledgeBaseId=KB_ID,
        retrievalQuery={
            "text": question
        }
    )

    results = response.get("retrievalResults", [])

    if not results:
        return "Maaf, saya tidak menemukan informasi yang relevan."


    # 2. Combine retrieved documents into context
    context = "\n\n".join(
        result.get("content", {}).get("text", "")
        for result in results
    )


    # 3. Create prompt
    prompt = f"""
You are a helpful travel assistant.

Answer the user's question based only on the information provided
in the context below.

If the answer cannot be found in the context, say that you don't
have enough information.

Context:
{context}

Question:
{question}

Answer:
"""


    # 4. Generate answer using Bedrock model
    response = model_client.converse(
        modelId=MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "text": prompt
                    }
                ]
            }
        ]
    )


    # 5. Return generated answer
    return response["output"]["message"]["content"][0]["text"]