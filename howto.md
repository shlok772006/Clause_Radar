flowchart LR
    A["/gsd:verify-work <N-1>"] --> B["/gsd:discuss-phase <N>"]
    B --> C["/gsd:plan-phase <N>"]
    C --> D["/gsd:execute-phase <N>"]
    D --> E["/gsd:verify-work <N>"]
