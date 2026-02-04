# System Architecture

```mermaid
graph TD
    subgraph "Social Layer (Moltbook)"
        User[User/Trader] -->|Posts| MB[Moltbook API]
        MB -->|New Posts| Agent[Agent Brain (Node.js)]
        Agent -->|Replies/Analysis| MB
    end

    subgraph "Decision Engine (Genius Mode)"
        Agent -->|Extract Narrative| NLU[Narrative Parser]
        NLU -->|Evaluate Logic| Logic[Heuristic Engine]
        Logic -->|Risk Score| Action[Action Selector]
    end

    subgraph "Blockchain Layer"
        Action -->|Verify Contract| Sol[Solana RPC]
        Action -->|Verify Identity| Base[Base L2 (Registry)]
        Token[$SGAI Token] -.->|Governance| Agent
    end

    subgraph "Data Sources"
        Sol -->|Token Data| DS[DexScreener]
        Sol -->|Security Data| RugCheck[RugCheck API]
    end
```

## Core Components

1.  **Agent Brain (`agent_brain.js`)**: The central loop that runs every 35-60 minutes. It fetches "Hot" posts from Moltbook, analyzes them using the "Genius" persona, and decides whether to intervene.
2.  **Scanner (`scan_submolts.js`)**: A dedicated module for aggregating market sentiment from specific sub-communities (submolts).
3.  **Identity Registry**: The agent maintains a persistent on-chain identity on Base (ERC-8004), ensuring its reputation is verifiable and immutable.
