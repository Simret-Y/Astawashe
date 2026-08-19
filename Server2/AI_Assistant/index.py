from dotenv import load_dotenv
import os
import shutil
import uuid

from src.helper import (
    load_pdf_file,
    filter_to_minimal_docs,
    text_split,
    download_hugging_face_embeddings
)

from langchain_chroma import Chroma
from langchain_core.documents import Document

load_dotenv()

GROK_API_KEY = os.environ.get('GROQ_API_KEY')
os.environ["GROQ_API_KEY"] = GROK_API_KEY

print(" Loading PDF files...")
extracted_data = load_pdf_file(data='data/')
print(f"Loaded {len(extracted_data)} pages")

print("Filtering documents...")
filter_data = filter_to_minimal_docs(extracted_data)
print(f"Filtered to {len(filter_data)} documents")

print(" Splitting into chunks...")
text_chunks = text_split(filter_data)
print(f" Created {len(text_chunks)} text chunks")

for i, chunk in enumerate(text_chunks):
    if not hasattr(chunk, 'page_content') or not chunk.page_content:
        print(f" Warning: Chunk {i} has no content, skipping")
        text_chunks.pop(i)

print(" Loading embeddings...")
embeddings = download_hugging_face_embeddings()
print(" Embeddings loaded")

persist_directory = "./chroma_db"


if os.path.exists(persist_directory):
    print(f"emoving existing ChromaDB at {persist_directory}")
    shutil.rmtree(persist_directory)

print(f"Creating ChromaDB at {persist_directory} with {len(text_chunks)} chunks...")

ids = [str(uuid.uuid4()) for _ in range(len(text_chunks))]

docsearch = Chroma.from_documents(
    documents=text_chunks,
    embedding=embeddings,
    persist_directory=persist_directory,
    ids=ids
)

print(f" ChromaDB created successfully!")
print(f" Database saved to: {persist_directory}")
print(f" Total chunks indexed: {len(text_chunks)}")

print("\n Testing retrieval...")
test_query = "medical information"
results = docsearch.similarity_search(test_query, k=2)
print(f"Test query: '{test_query}'")
print(f"Found {len(results)} relevant chunks")

for i, doc in enumerate(results):
    print(f"\nResult {i+1}:")
    print(f"Content preview: {doc.page_content[:200]}...")
    if hasattr(doc, 'metadata'):
        print(f"Metadata: {doc.metadata}")

print(" Setup complete!")