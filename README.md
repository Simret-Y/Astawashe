# AstaWashe — AI Assistant, RAG, Communication & Community

**Issue:** #6 — BE-03  
**Assignee:** Sophonyas Bewuketu (@SophyJR)

## Overview

This module is responsible for the AI and supporting backend services of AstaWashe.

## Responsibilities

- AI Health Assistant
- RAG pipeline
- ChromaDB knowledge base
- Voice interaction
- Multilingual AI support
- Patient-doctor communication
- Appointments
- Community features
- Health outcomes

## AI Architecture

```text
Patient
   ↓
Core Backend API
   ↓
AI Service (Flask / Python)
   ↓
RAG Pipeline
   ↓
ChromaDB + Embeddings
   ↓
AI Health Assistant
   ↓
Text / Voice Response