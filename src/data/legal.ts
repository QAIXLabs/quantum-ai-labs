/**
 * Terms, Privacy and Disclaimer copy.
 *
 * Written in general terms from what the site actually does. It is not legal advice; a review by
 * a lawyer before relying on it is still recommended. Setting LEGAL_DRAFT to true shows a
 * "draft" banner, and any [PLACEHOLDER] token renders highlighted.
 */

export const LEGAL_DRAFT = false
export const LEGAL_UPDATED = '13 November 2026'

export type LegalSection = { heading: string; body?: string[]; list?: string[] }
export type LegalDoc = { slug: 'terms' | 'privacy' | 'disclaimer'; title: string; summary: string; sections: LegalSection[] }

export const legalDocs: LegalDoc[] = [
  {
    slug: 'terms',
    title: 'Terms of Use',
    summary: 'The rules for using the Quantum AI Labs website and its tools.',
    sections: [
      {
        heading: 'About these terms',
        body: [
          'This website and its tools (the “Service”) are operated by Quantum AI Labs (“we”). By using the Service you agree to these terms. If you do not agree, do not use the Service.',
        ],
      },
      {
        heading: 'What the Service is',
        body: [
          'The Service provides free informational and research tools for crypto: an AI market research agent, a wallet safety check, read-only blockchain monitors, automated checks of Solana coins, and access to a third-party crypto exchange.',
          'The Service is read-only. We never ask you to connect a wallet, we never hold your funds or private keys, and we never sign transactions on your behalf. Features may change, be limited or be discontinued at any time.',
        ],
      },
      {
        heading: 'No financial advice',
        body: [
          'Everything on the Service, including AI agent answers, charts, indicators, screens, coin checks and articles, is general information only. It is not investment, financial, legal or tax advice, and it is not a recommendation to buy, sell or hold any asset. Do your own research and consider independent professional advice.',
        ],
      },
      {
        heading: 'Swaps through a third-party provider',
        body: [
          'Exchanges started on the swap page are executed by an independent third-party exchange provider, under its own terms and policies. Quantum AI Labs does not receive, hold or transmit your funds.',
          'Quoted amounts are estimates and may change until your deposit is received. You are responsible for entering correct receiving and refund addresses; blockchain transactions are irreversible. The provider may delay, refuse or require verification for transactions according to its own compliance policies.',
        ],
      },
      {
        heading: 'The QAI token',
        body: [
          'Nothing on the Service is an offer, solicitation or invitation to buy or sell the QAI token or any other asset. Using the tools does not require holding QAI. Please read the Disclaimer for the risks of crypto assets and of QAI in particular.',
        ],
      },
      {
        heading: 'Coin checks',
        body: [
          'Quantum Lab CHECKS gives automated opinions about Solana coins based on public data at the time of the check, and publishes them in a public feed. A verdict is not an endorsement, a safety guarantee, an accusation of wrongdoing or a statement of fact about any person or project.',
          'If you represent a project and believe a check is mistaken, contact us through the official social channels linked on this website.',
        ],
      },
      {
        heading: 'Acceptable use',
        list: [
          'Do not use the Service for any unlawful purpose, including money laundering, terrorist financing, fraud or evading sanctions.',
          'Do not attempt to overload, scrape beyond normal use, bypass rate limits or interfere with the Service or its providers.',
          'Do not use the Service if you are subject to sanctions, or if using it is prohibited where you live. You are responsible for complying with the laws that apply to you.',
        ],
      },
      {
        heading: 'Third-party data and AI output',
        body: [
          'Prices, chain data and token information come from public third-party sources and may be delayed, incomplete or wrong. AI-generated answers can be inaccurate or out of date. Always verify important information independently, for example in a block explorer.',
        ],
      },
      {
        heading: 'Intellectual property',
        body: [
          'The Quantum AI Labs name, logo, design and original content belong to Quantum AI Labs. Third-party names and data belong to their respective owners.',
        ],
      },
      {
        heading: 'No warranty and limitation of liability',
        body: [
          'The Service is provided “as is” and “as available”, without warranties of any kind. To the maximum extent permitted by law, Quantum AI Labs is not liable for any loss or damage arising from your use of, or reliance on, the Service, including trading losses, lost funds, errors in third-party data or AI output, or the actions of third-party providers.',
        ],
      },
      {
        heading: 'Changes, governing law and contact',
        body: [
          'We may update these terms; the date above shows the latest version. For questions, contact us through the official social channels linked on this website.',
        ],
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    summary: 'What data the Service handles, why, and who else receives it.',
    sections: [
      {
        heading: 'In short',
        list: [
          'There are no accounts and no wallet connection.',
          'We do not use advertising or analytics cookies, and we do not sell data.',
          'Addresses and messages you enter are sent to the services needed to answer your request and are not stored on our servers. Coin checks are the exception: their results are saved and shown publicly.',
          'Your preferences and history stay in your own browser.',
        ],
      },
      {
        heading: 'Data we process',
        list: [
          'Technical data: your IP address and request details are processed by our hosting provider to deliver the site, and held briefly in memory to enforce rate limits.',
          'Addresses, transaction hashes and token addresses you look up: forwarded to public blockchain and market data providers to answer the request. Results may be cached in server memory for a few minutes at most and are not written to storage.',
          'Messages to the Quantum Agent: sent to a third-party AI model provider to generate the answer. We do not store conversations on our servers. Never enter private keys or seed phrases.',
          'Swap details (coins, amounts, receiving and refund addresses): sent to the third-party exchange provider to create and track your exchange, under its own privacy policy.',
          'Coin checks: the coin address you submit, together with the coin’s public website text and on-chain data, is sent to a third-party AI model provider to write the verdict. The result is saved with our storage provider and published in the public feed for up to 90 days. It does not include your IP address or anything else about who ran the check.',
        ],
      },
      {
        heading: 'Stored in your browser',
        body: [
          'The Service uses your browser’s local storage for settings, watchlists, alerts, swap history, agent conversations and recently checked addresses. This data stays on your device; you can delete it at any time by clearing site data in your browser.',
        ],
      },
      {
        heading: 'Third parties',
        list: [
          'Hosting: our website hosting provider.',
          'AI: a third-party AI model provider.',
          'Exchange: an independent third-party exchange provider.',
          'Market data: third-party public market and token data providers.',
          'Blockchain data: public blockchain nodes and block explorer services.',
          'Storage: a third-party database provider that holds published coin checks.',
          'Fonts: Google Fonts, which receives your IP address when the fonts load.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          'Depending on where you live, you may have rights to access, correct or delete personal data. Because we do not keep accounts, and published coin checks contain nothing about who ran them, there is usually nothing held about you on our side. Contact us through the official social channels linked on this website with any request.',
        ],
      },
      {
        heading: 'Children',
        body: ['The Service is not intended for anyone under 18.'],
      },
      {
        heading: 'Changes',
        body: ['We may update this policy; the date above shows the latest version.'],
      },
    ],
  },
  {
    slug: 'disclaimer',
    title: 'Disclaimer',
    summary: 'Risks of crypto assets, the limits of our tools, and important notes about the QAI token.',
    sections: [
      {
        heading: 'Not financial advice',
        body: [
          'Quantum AI Labs publishes research tools and educational content. Nothing on this website is financial, investment, legal or tax advice, and nothing is a recommendation to buy, sell or hold any crypto asset.',
        ],
      },
      {
        heading: 'Crypto assets are high risk',
        list: [
          'Prices are highly volatile and can fall to zero.',
          'Transactions are irreversible; sending to a wrong address usually means the funds are lost.',
          'Scams, phishing, rug pulls and fake tokens are common.',
          'Regulation differs by country and can change quickly.',
          'Only use money you can afford to lose entirely.',
        ],
      },
      {
        heading: 'About the QAI token',
        // Review: confirm every statement below matches the token's actual design before launch.
        list: [
          'QAI is a crypto token connected to the Quantum AI Labs community. Holding it does not give ownership, equity, voting rights in a company, or any claim on revenue, profits or assets.',
          'There is no promise or expectation of profit, price, liquidity, exchange listing or future value.',
          'The token is not offered to anyone where its offer or sale would be unlawful.',
          'The only official contract address is the one published on this website and the official social channels linked from it. Always verify it there; impostor tokens with the same name or ticker may exist.',
          'The team will never message you first asking for funds, private keys or seed phrases, and will never promise returns.',
        ],
      },
      {
        heading: 'Limits of our tools',
        list: [
          'Market data, indicators and screens can be delayed or wrong, and past performance does not predict future results.',
          'AI agent answers can be inaccurate, incomplete or out of date.',
          'Quantum Lab CHECKS verdicts are automated opinions on public data at the moment of the check. A good verdict is not an endorsement or a safety guarantee, and a poor one is not proof of fraud.',
          'The wallet safety check reports what it finds in public on-chain data and third-party threat lists. It cannot see leaked seed phrases or off-chain signatures, threat lists can be incomplete or wrong, and a result without warnings is not a guarantee of safety.',
          'Third-party services, including the exchange provider, operate independently and are outside our control.',
        ],
      },
      {
        heading: 'Forward-looking statements',
        body: [
          'The roadmap and any statements about future plans describe intentions only. They are not commitments, and plans may change or be cancelled.',
        ],
      },
    ],
  },
]

export const legalBySlug = (slug: string | undefined) => legalDocs.find((d) => d.slug === slug)
