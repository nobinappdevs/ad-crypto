/**
 * The site's two legal documents, as data.
 *
 * DRAFTS, not vetted text: they describe how this product actually behaves — the
 * quote hold, the coin-denominated charges, the KYC gate, the gateways it hands
 * payments to — but the operator's counsel has to review them before launch, and
 * the jurisdiction, entity name and retention periods below are placeholders.
 *
 * English only, deliberately. The rest of the site is translated; a legal document
 * translated by a UI dictionary is a liability, so this stays in one authoritative
 * language until a lawyer supplies the others.
 */

export interface LegalSection {
  /** Anchored, so a clause can be linked to directly. */
  id: string;
  heading: string;
  body: string[];
  /** Rendered as a bulleted list under the paragraphs. */
  list?: string[];
}

export interface LegalDocument {
  /** "25 August 2026" — shown under the page title. */
  updated: string;
  intro: string[];
  sections: LegalSection[];
}

/** The operator's published contact points, the same ones the footer carries. */
export const LEGAL_CONTACT = {
  site: "adcrypto.com",
  phone: "+1564-644-5965",
  address: "Los Angeles, CA",
} as const;

const UPDATED = "25 August 2026";

export const TERMS: LegalDocument = {
  updated: UPDATED,
  intro: [
    'These Terms of Use govern your access to the AdCrypto website, dashboard and wallet services (together, the "Service"). By creating an account or using any part of the Service, you agree to them.',
    "Please read them together with our Privacy Policy, which explains what we collect and why.",
  ],
  sections: [
    {
      id: "eligibility",
      heading: "1. Who may use the Service",
      body: [
        "You must be at least 18 years old and legally able to enter into a binding contract. You may not use the Service if you are located in, or acting on behalf of anyone located in, a country or region subject to comprehensive sanctions, or if you appear on any applicable sanctions list.",
        "One person may hold one account. Accounts may not be sold, shared or transferred.",
      ],
    },
    {
      id: "account",
      heading: "2. Your account and its security",
      body: [
        "You are responsible for the information you give us being accurate and kept up to date, and for everything done through your account.",
        "Keep your password and two-factor codes to yourself. We will never ask you for them. Tell us immediately if you believe your account has been accessed by someone else — until you do, activity carried out with your credentials is treated as yours.",
      ],
    },
    {
      id: "verification",
      heading: "3. Identity verification",
      body: [
        "Before certain features become available we are required to verify who you are. You agree to provide accurate identity information and documents on request, and you accept that features may stay limited, or an order may be held, until verification is complete.",
        "We may decline, pause or reverse verification where information cannot be confirmed, and we may re-verify an account at any time.",
      ],
    },
    {
      id: "orders",
      heading: "4. Buying, selling, exchanging and withdrawing",
      body: [
        "Prices shown before you confirm are quotes, held for a short period that is stated on the order screen. If the hold expires, the order is re-priced before it can be confirmed.",
        "A confirmed order is submitted for processing and cannot be recalled by you. Blockchain transfers in particular are irreversible: an address you enter is the address we send to, and coins sent to a wrong or incompatible address cannot be recovered by us.",
        "Orders may be marked pending, confirmed, cancelled or rejected. Where an order is rejected, the reason is shown against it in your transaction history, and any amount already debited is returned to the wallet it came from.",
      ],
    },
    {
      id: "fees",
      heading: "5. Fees and charges",
      body: [
        "Each order shows its charge before you confirm it: a fixed component, a percentage component, and the resulting total payable. Charges are denominated in the currency stated on the order screen, which for a crypto order is the coin itself.",
        "Network fees charged by a blockchain, and any fee charged by a payment provider or your bank, are separate from ours and are not refundable by us.",
      ],
    },
    {
      id: "gateways",
      heading: "6. Payment providers",
      body: [
        "Payments and payouts may be handled by third-party providers. Their own terms apply to that part of the transaction, and where an order depends on a provider completing a payment, its status follows what the provider reports back to us.",
        "Where a payout requires details you supply — a bank account, a wallet address — you are responsible for their accuracy.",
      ],
    },
    {
      id: "risk",
      heading: "7. Risk you accept",
      body: [
        "Digital assets are volatile. Their value can fall as well as rise, and it can do so quickly and without warning. You may lose the whole amount you commit.",
        "Digital assets held through the Service are not bank deposits and are not covered by deposit protection or insurance schemes.",
        "Nothing on the site or in the dashboard is investment, tax or legal advice. Decisions you make are yours.",
      ],
    },
    {
      id: "acceptable-use",
      heading: "8. What you may not do",
      body: ["You agree not to use the Service to:"],
      list: [
        "break any law, or launder money, finance terrorism or evade sanctions",
        "impersonate anyone, or use another person's identity documents or payment instruments",
        "manipulate prices, or place orders you do not intend to settle",
        "probe, scrape, overload or reverse-engineer the Service, or access it by automated means we have not authorised",
        "circumvent a limit, a verification requirement or a suspension",
      ],
    },
    {
      id: "suspension",
      heading: "9. Suspension and closure",
      body: [
        "We may limit, suspend or close an account, and may hold, cancel or reject an order, where we reasonably believe it is necessary to comply with the law, to protect the Service or another user, or where these Terms have been breached.",
        "You may close your account at any time from the dashboard. Closure does not affect obligations already incurred, and we may retain records where the law requires it.",
      ],
    },
    {
      id: "availability",
      heading: "10. Availability and changes to the Service",
      body: [
        "We aim to keep the Service available, but we do not promise it will be uninterrupted. Maintenance, network conditions and provider outages can all interrupt it.",
        "Features may be added, changed or withdrawn. Where a change materially reduces what your account can do, we will give notice where it is reasonable to do so.",
      ],
    },
    {
      id: "ip",
      heading: "11. Our content",
      body: [
        "The Service, its software, design, text and marks belong to us or our licensors. You may use them only as the Service intends. Nothing here transfers ownership to you.",
      ],
    },
    {
      id: "liability",
      heading: "12. Limits on our liability",
      body: [
        "To the extent the law allows, we are not liable for loss of profit, loss of opportunity, or losses caused by the price movement of a digital asset, by a blockchain network, or by an address or payout detail you entered incorrectly.",
        "Nothing in these Terms excludes liability that cannot lawfully be excluded, including for fraud.",
      ],
    },
    {
      id: "law",
      heading: "13. Governing law",
      body: [
        "These Terms are governed by the laws of the jurisdiction in which the operator of the Service is established, and disputes are subject to the courts of that jurisdiction, unless mandatory law in your country of residence provides otherwise.",
      ],
    },
    {
      id: "changes",
      heading: "14. Changes to these Terms",
      body: [
        "We may update these Terms. The date at the top shows when they last changed, and continuing to use the Service after a change means you accept the updated version.",
      ],
    },
    {
      id: "contact",
      heading: "15. Contact",
      body: [
        `Questions about these Terms can be sent through the contact page, or to ${LEGAL_CONTACT.address} — ${LEGAL_CONTACT.phone}.`,
      ],
    },
  ],
};

export const PRIVACY: LegalDocument = {
  updated: UPDATED,
  intro: [
    "This Privacy Policy explains what personal information AdCrypto collects, why we collect it, who we share it with, and what you can ask us to do with it.",
    "It applies to the website, the dashboard and the wallet services.",
  ],
  sections: [
    {
      id: "what-we-collect",
      heading: "1. What we collect",
      body: ["Depending on how you use the Service, we collect:"],
      list: [
        "Account information — name, email address, phone number, password (stored hashed) and your two-factor settings.",
        "Identity information — the documents and details you submit for verification, including images of an identity document and, where required, a selfie.",
        "Transaction information — the orders you place, their amounts, charges, status, references, and the wallet addresses and payout details involved.",
        "Payment information — what a payment provider reports back to us about a payment. Full card numbers are handled by the provider and are not stored by us.",
        "Technical information — IP address, device and browser details, and log records of how the Service was used.",
        "Communications — messages you send us through the contact form or support channels.",
      ],
    },
    {
      id: "why",
      heading: "2. Why we use it",
      body: ["We use personal information to:"],
      list: [
        "open and operate your account, and carry out the orders you place",
        "verify your identity and meet anti-money-laundering and sanctions obligations",
        "detect, investigate and prevent fraud, abuse and unauthorised access",
        "provide support and answer what you ask us",
        "keep records we are legally required to keep, and respond to lawful requests",
        "improve the Service, and — only with your consent — send you product news you can unsubscribe from at any time",
      ],
    },
    {
      id: "sharing",
      heading: "3. Who we share it with",
      body: [
        "We do not sell personal information. We share it only where it is needed to run the Service or where the law requires it:",
      ],
      list: [
        "identity verification and anti-money-laundering providers",
        "payment and payout providers, for the transaction they are handling",
        "hosting, storage, analytics and communication providers acting on our instructions",
        "regulators, law enforcement and courts, where we are legally obliged to respond",
        "a buyer or successor, if the business or part of it is transferred — with this policy continuing to apply",
      ],
    },
    {
      id: "blockchain",
      heading: "4. Information on a blockchain is public",
      body: [
        "A transfer to or from a public blockchain is recorded on that network. Addresses, amounts and timestamps are public, permanent, and outside our control — we cannot amend or erase them, and neither can you. Anyone who links an address to you can see its history.",
      ],
    },
    {
      id: "cookies",
      heading: "5. Cookies and browser storage",
      body: [
        "We use cookies and browser storage to keep you signed in, to remember preferences such as your language and theme, and to keep the Service secure.",
        "You can clear or block them in your browser, but parts of the Service — signing in, in particular — will not work without them.",
      ],
    },
    {
      id: "retention",
      heading: "6. How long we keep it",
      body: [
        "Account and transaction records are kept for as long as your account is open and afterwards for the period financial and anti-money-laundering rules require — commonly five years from the end of the relationship or the date of a transaction.",
        "Information we no longer need, and that we are not required to keep, is deleted or anonymised.",
      ],
    },
    {
      id: "security",
      heading: "7. How we protect it",
      body: [
        "Traffic is encrypted in transit, passwords are stored hashed, and access to identity documents is restricted to staff who need it. Two-factor authentication is available on your account and we recommend turning it on.",
        "No system is perfectly secure. If a breach affects your personal information and the law requires it, we will notify you and the relevant authority.",
      ],
    },
    {
      id: "rights",
      heading: "8. Your rights",
      body: [
        "Depending on where you live, you may ask us to give you a copy of your personal information, correct it, delete it, restrict or object to how we use it, or send it to another provider. You can also withdraw consent to marketing at any time.",
        "Much of this you can do yourself: your profile page edits your details, and the dashboard has an account deletion option. For anything else, contact us — we will answer within the period the law allows, and we may need to verify who you are first.",
        "Deletion has a limit: records we must keep by law are retained even after an account is closed.",
      ],
    },
    {
      id: "children",
      heading: "9. Children",
      body: [
        "The Service is not for anyone under 18, and we do not knowingly collect information from them. If we learn that we have, we delete it.",
      ],
    },
    {
      id: "transfers",
      heading: "10. International transfers",
      body: [
        "We and our providers may process personal information in countries other than yours. Where we do, we use the safeguards the applicable law requires for that transfer.",
      ],
    },
    {
      id: "changes",
      heading: "11. Changes to this policy",
      body: [
        "We may update this policy. The date at the top shows when it last changed, and material changes will be signalled in the Service.",
      ],
    },
    {
      id: "contact",
      heading: "12. Contact",
      body: [
        `Privacy questions and requests can be sent through the contact page, or to ${LEGAL_CONTACT.address} — ${LEGAL_CONTACT.phone}.`,
      ],
    },
  ],
};
