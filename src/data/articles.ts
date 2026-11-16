export type ArticleKind = 'fact' | 'hypothesis' | 'experimental' | 'open'

export type Article = {
  slug: string
  title: string
  category: string
  minutes: number
  summary: string
  sections: { heading: string; kind: ArticleKind; body: string[] }[]
}

export const categories = ['AI systems', 'Cryptography', 'Decentralized systems']

export const kindStyles: Record<ArticleKind, { label: string; cls: string }> = {
  fact: { label: 'Established', cls: 'text-lab-ok border-lab-ok/30' },
  hypothesis: { label: 'Hypothesis', cls: 'text-amber-200 border-amber-300/30' },
  experimental: { label: 'Experimental idea', cls: 'text-[#b9adff] border-lab-violet/40' },
  open: { label: 'Open question', cls: 'text-white/60 border-white/20' },
}

export const articles: Article[] = [
  {
    slug: 'ai-systems',
    title: 'How AI agents like ours work',
    category: 'AI systems',
    minutes: 6,
    summary: 'What happens when you ask the Quantum Agent a question, and why a confident answer still needs checking.',
    sections: [
      {
        heading: 'Predicting the next word',
        kind: 'fact',
        body: [
          'Most of today’s large language models are built on the transformer, an architecture published in 2017. Its key trick, called self-attention, lets the model weigh how much each word in a text matters to every other word. That made it practical to train on huge amounts of data.',
          'At heart, the model is trained to guess the next piece of text. Summarising, writing code and answering questions all grow out of that one skill once the model is large enough and has been fine-tuned.',
        ],
      },
      {
        heading: 'Sounding sure isn’t the same as being right',
        kind: 'fact',
        body: [
          'Because a model writes whatever text is most likely, it can state something wrong with total confidence. People call these hallucinations. Numbers, prices and anything you plan to act on should always be checked against the source data.',
        ],
      },
      {
        heading: 'Giving the model tools',
        kind: 'experimental',
        body: [
          'An agent lets the model call tools between steps of its reasoning, for example to fetch prices or draw a chart. Research such as ReAct shows this can make answers better grounded, although reliability, cost and safety are still being worked out across the industry.',
          'Our Quantum Agent has a short list of read-only tools: market data, charts, pump.fun screening and swap quotes. It shows you which ones it used for each answer. It can’t make transactions, sign anything or access your wallet.',
        ],
      },
    ],
  },
  {
    slug: 'verifiable-computation',
    title: 'Proving a result without redoing the work',
    category: 'Cryptography',
    minutes: 5,
    summary: 'How cryptography lets you check that a computation was done correctly, and how we might use it for our own analyses.',
    sections: [
      {
        heading: 'Convincing someone without showing everything',
        kind: 'fact',
        body: [
          'An interactive proof lets one party convince another that a statement is true by exchanging messages. A zero-knowledge proof goes further and reveals nothing except that the statement holds. Goldwasser, Micali and Rackoff laid the groundwork for both ideas in the 1980s.',
        ],
      },
      {
        heading: 'Short proofs in real systems',
        kind: 'fact',
        body: [
          'Modern proof systems such as SNARKs and STARKs produce small proofs that are cheap to check. Ethereum zk-rollups use them to prove that a whole batch of transactions was processed correctly.',
        ],
      },
      {
        heading: 'A fingerprint for every analysis',
        kind: 'experimental',
        body: [
          'A simpler version is to take a SHA-256 fingerprint of an analysis, including its inputs, settings and results, and record it on-chain. Anyone could then confirm later that a published result hasn’t been changed. We’re researching how to do this for the lab’s own analyses.',
        ],
      },
    ],
  },
  {
    slug: 'decentralized-infrastructure',
    title: 'Reading a blockchain',
    category: 'Decentralized systems',
    minutes: 6,
    summary: 'Blocks, nodes, gas fees and what you can and can’t learn from public network data.',
    sections: [
      {
        heading: 'A shared ledger',
        kind: 'fact',
        body: [
          'A blockchain is a ledger that only grows, copied across many computers called nodes. A consensus process decides which new blocks count. Bitcoin started with proof-of-work. Ethereum added a virtual machine for smart contracts and has since moved to proof-of-stake.',
        ],
      },
      {
        heading: 'How apps read the chain',
        kind: 'fact',
        body: [
          'EVM nodes answer standard requests such as the latest block number, an address balance or a contract call. Public endpoints are handy, but they can be rate limited, fall a little behind or go down for a while. Serious apps usually run their own nodes or rent dedicated ones.',
          'Before trusting an answer, it’s worth confirming the endpoint is on the network you expect. Web3 Solutions checks the chain ID on every request for exactly that reason.',
        ],
      },
      {
        heading: 'Gas and fees',
        kind: 'fact',
        body: [
          'Since EIP-1559, every Ethereum block has a base fee set by the protocol, which is burned, plus an optional tip for the validator. The base fee goes up when blocks are busier than the target and down when they are quieter. Layer 2 networks add a fee for posting their data back to Ethereum.',
        ],
      },
      {
        heading: 'Could agents coordinate on-chain?',
        kind: 'hypothesis',
        body: [
          'Some researchers suggest blockchains could act as a shared record and audit trail for AI agents working on their own. Nobody has fully solved who holds the keys, what it costs, how fast it is or who is responsible when something goes wrong.',
        ],
      },
    ],
  },
  {
    slug: 'post-quantum-cryptography',
    title: 'Quantum computers and your wallet',
    category: 'Cryptography',
    minutes: 6,
    summary: 'Why today’s wallet keys face a long-term risk, and what the new NIST standards change.',
    sections: [
      {
        heading: 'What a quantum computer could break',
        kind: 'fact',
        body: [
          'RSA and elliptic-curve cryptography, which most blockchains use for signatures, rely on maths problems that Shor’s algorithm could solve on a large, error-corrected quantum computer. Hash functions and symmetric ciphers hold up much better. Grover’s algorithm roughly halves their effective strength.',
          'Data can also be collected now and decrypted years later, an approach known as “harvest now, decrypt later”. That’s why it makes sense to plan the switch before such machines exist.',
        ],
      },
      {
        heading: 'The new NIST standards',
        kind: 'fact',
        body: [
          'In August 2024 NIST published three post-quantum standards: FIPS 203 (ML-KEM, based on CRYSTALS-Kyber) for exchanging keys, and FIPS 204 (ML-DSA, based on CRYSTALS-Dilithium) and FIPS 205 (SLH-DSA, based on SPHINCS+) for digital signatures.',
        ],
      },
      {
        heading: 'What it means for blockchains',
        kind: 'open',
        body: [
          'Moving a blockchain to post-quantum signatures means bigger keys and signatures, more work to verify them and an upgrade everyone has to agree on. Nobody knows when a quantum computer strong enough to break today’s keys will arrive, and expert estimates vary a lot.',
        ],
      },
    ],
  },
]
