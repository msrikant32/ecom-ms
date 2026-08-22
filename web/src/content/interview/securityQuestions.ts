import type { InterviewQuestion } from "./types";

// Encryption, hashing, and the security concepts built directly on them —
// basic through lead/architect level. A dedicated category/topic rather
// than folded into Node.js/Backend, since this is dense and distinct
// enough (cryptographic concepts, not just Express patterns) to earn its
// own bucket, the same way SQL/NoSQL earned theirs under "database".
export const securityQuestions: InterviewQuestion[] = [
  {
    slug: "encryption-vs-hashing-fundamentals",
    question: "What is encryption, and what is hashing — and what's the actual difference?",
    category: "Security",
    round: "general",
    summary:
      "Encryption is reversible — a key gets you back the original data. Hashing is one-way — there's no key that reverses it, only a re-hash-and-compare. That single distinction decides which one is correct for a given problem.",
    intro:
      "This looks like a definitions question, but the strongest answer leads with the one-sentence distinction and lets the definitions fall out of it, rather than defining each term in isolation and leaving the connection implicit.",
    sections: [
      {
        heading: "Encryption — reversible, for data you need back",
        points: [
          {
            title: "A key transforms data there and back",
            detail:
              "Encryption transforms data using a key so it can be decrypted back to its original form by anyone holding the right key. Used whenever the original data needs to be recovered later — data in transit (TLS), data at rest (encrypted DB fields, disk encryption), a secret you need to read back out.",
          },
        ],
      },
      {
        heading: "Hashing — one-way, for data you only ever verify",
        points: [
          {
            title: "A fixed-size fingerprint, with no reverse operation",
            detail:
              "Hashing produces a deterministic, fixed-size output from any input — the same input always hashes to the same output, and a good hash function makes it computationally infeasible to find two different inputs that hash to the same output (collision resistance). There is no key or operation that turns a hash back into its original input. You never 'decrypt' a hash; you re-hash something and compare the results.",
            code: `// why passwords are HASHED, never encrypted:
// the server never needs the original password back — only to verify
// a login attempt produces the same hash as what was stored at signup
const matches = await bcrypt.compare(attemptedPassword, storedHash);`,
            codeLanguage: "javascript",
            sourceRef: "express-production-api/src/models/User.js — comparePassword() using bcrypt.compare",
          },
        ],
      },
    ],
    closingTip:
      "The one sentence to lead with: 'encryption is for data you need back later, hashing is for data you only ever need to verify, never retrieve' — password storage is the canonical example that makes the distinction concrete instantly.",
  },
  {
    slug: "symmetric-vs-asymmetric-encryption",
    question: "Symmetric vs asymmetric encryption — what's the difference, and when does each get used?",
    category: "Security",
    round: "general",
    summary:
      "Symmetric uses one shared key for both encrypt and decrypt — fast, but the key has to reach both sides safely. Asymmetric uses a public/private key pair — solves the key-sharing problem, at a real performance cost, which is why real systems use both together.",
    intro: "The strongest answers name the actual tradeoff (speed vs. the key-distribution problem) and then explain why TLS uses both together rather than picking one.",
    sections: [
      {
        heading: "Symmetric — one key, fast, but has to be shared",
        points: [
          {
            title: "AES — the same key encrypts and decrypts",
            detail:
              "Fast and efficient, well suited to encrypting large amounts of data. The catch: both parties need the exact same key, and getting that key from one side to the other without an eavesdropper intercepting it is a real, unsolved problem on its own — this is exactly the problem asymmetric encryption solves.",
          },
        ],
      },
      {
        heading: "Asymmetric — a key pair, solves key distribution, but slower",
        points: [
          {
            title: "RSA/ECC — a public key encrypts, only the matching private key decrypts",
            detail:
              "The public key can be handed out to literally anyone — only the private key holder can decrypt what was encrypted with it. This solves key distribution (no secret ever needs to travel over the wire), at the cost of being significantly slower than symmetric encryption for large amounts of data.",
          },
        ],
      },
      {
        heading: "Why real systems use both together",
        points: [
          {
            title: "TLS: asymmetric to exchange a key, symmetric for the actual data",
            detail:
              "A TLS handshake uses asymmetric encryption briefly, just to safely establish a shared symmetric session key between client and server — then switches to fast symmetric encryption (AES) for the actual bulk data transfer for the rest of the connection. This hybrid approach gets asymmetric's key-distribution safety without paying its performance cost on every byte transferred.",
            relatedLink: { href: "/interview/tls-https-in-transit", label: "The full TLS handshake, step by step" },
          },
        ],
      },
    ],
    closingTip: "Naming the TLS hybrid approach unprompted — 'asymmetric to solve key exchange, then symmetric for speed' — is the single strongest signal in this question; it shows you understand WHY both exist, not just that they do.",
  },
  {
    slug: "password-hashing-bcrypt-salting",
    question: "How should passwords actually be stored, and why is bcrypt specifically used instead of a plain hash?",
    category: "Security",
    round: "general",
    summary:
      "Hashed, salted, and deliberately slow — a fast general-purpose hash (SHA-256) is the WRONG tool for passwords specifically, because its speed is exactly what makes brute-forcing cheap.",
    intro: "This question has a specific trap: naming 'use SHA-256' sounds reasonable but is a real, common mistake — the strongest answer explains why a fast hash is actually the wrong choice here.",
    sections: [
      {
        heading: "Why not a fast hash like SHA-256",
        points: [
          {
            title: "Speed is a feature for integrity checks, a liability for passwords",
            detail:
              "SHA-256 is designed to be FAST — billions of hashes per second on commodity hardware, which is exactly what you want for checking a file's integrity. For a password hash, that same speed lets an attacker who steals the hash database try billions of guesses per second against it — fast is the wrong property to optimize for here.",
          },
        ],
      },
      {
        heading: "bcrypt — deliberately slow, with a tunable cost factor",
        points: [
          {
            title: "A cost/work factor that can be increased as hardware gets faster",
            detail:
              "bcrypt (and scrypt/Argon2) are deliberately slow, with a configurable cost factor controlling exactly how slow — increasing the cost factor over time keeps pace with faster attacker hardware, something a fixed-speed hash can never do. This repo's SALT_ROUNDS constant is exactly that cost factor.",
            code: `const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12; // the cost factor — higher = slower = more brute-force-resistant

async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS); // salt is generated AND embedded automatically
}`,
            codeLanguage: "javascript",
            sourceRef: "express-production-api/src/models/User.js",
          },
        ],
      },
      {
        heading: "Salting — why two identical passwords don't produce identical hashes",
        points: [
          {
            title: "Defeats precomputed rainbow-table attacks",
            detail:
              "A salt is random data mixed into the password before hashing, unique per user, stored alongside the hash (it doesn't need to be secret). Without a salt, two users with the password 'password123' would have identical hashes — visible to anyone who steals the database — and an attacker could precompute a lookup table (a rainbow table) of hashes for common passwords once and reuse it against every stolen database ever. A unique salt per user makes precomputation useless: the attacker has to attack each hash individually.",
          },
        ],
      },
    ],
    closingTip: "The trap to avoid explicitly: don't just say 'hash the password' — say 'hash it with a slow, salted algorithm like bcrypt, specifically not a fast general-purpose hash like SHA-256, because fast is a liability here, not a feature.'",
  },
  {
    slug: "jwt-signing-vs-encryption",
    question: "Are JWTs encrypted? Walk through what a JWT's signature actually protects.",
    category: "Security",
    round: "general",
    summary:
      "No — a standard JWT (JWS) is signed, not encrypted. The payload is just base64-encoded and readable by anyone; the signature only proves it wasn't tampered with since the server issued it.",
    intro: "This is a genuinely common misconception worth naming explicitly and correcting — 'JWTs are secure' often silently assumes encryption when the default JWT format provides none.",
    sections: [
      {
        heading: "What a JWT's three parts actually are",
        points: [
          {
            title: "header.payload.signature — the first two are just base64, not encrypted",
            detail:
              "Anyone can base64-decode a JWT's header and payload and read them in plain text — try it on jwt.io. There is no encryption in a standard JWT (JWS, the common case). Never put a secret (a password, a raw API key) directly in a JWT payload — it's fully readable by the client holding the token, and by anyone it passes through.",
          },
          {
            title: "The signature proves integrity and authenticity, not confidentiality",
            detail:
              "The server signs header+payload with a secret (HMAC, symmetric) or a private key (RS256, asymmetric). Verifying the signature on a later request proves the token wasn't tampered with since issuance, and that it was genuinely issued by a party holding that secret/key — it says nothing about who can READ the payload, since anyone already can.",
            code: `const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
// token is READABLE by anyone (base64) — the secret only makes it UNFORGEABLE

const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET); // throws if tampered/expired`,
            codeLanguage: "javascript",
            sourceRef: "express-production-api/src/utils/tokens.js",
          },
        ],
      },
      {
        heading: "If you actually need the payload to be confidential",
        points: [
          {
            title: "JWE — a real, separate, less common standard",
            detail:
              "JWE (JSON Web Encryption) is a related but distinct standard that DOES encrypt the payload — genuinely rare in practice, since most systems just avoid putting sensitive data in the token at all (a user id and role are fine; a password or SSN is not) rather than reaching for JWE.",
          },
        ],
      },
    ],
    closingTip: "State the misconception and the correction in one line: 'a JWT's signature makes it tamper-evident, not confidential — the payload is plain, readable base64, so nothing sensitive belongs in it.'",
  },
  {
    slug: "tls-https-in-transit",
    question: "Walk through what actually happens during a TLS handshake.",
    category: "Security",
    round: "general",
    summary:
      "Asymmetric encryption briefly establishes a shared symmetric key (and verifies the server's identity via its certificate) — then the connection switches to fast symmetric encryption for the actual data.",
    intro: "The strongest answers connect this directly back to the symmetric-vs-asymmetric tradeoff question — TLS is the concrete real-world example of why both exist together.",
    sections: [
      {
        heading: "The handshake, at the level that matters for an interview",
        points: [
          {
            title: "Certificate verification, then key exchange, then symmetric encryption",
            detail:
              "The client connects and the server presents its certificate — signed by a trusted Certificate Authority, proving the server is who it claims to be (this is what stops a network-level attacker from silently impersonating the server). Client and server then use asymmetric cryptography to safely agree on a shared symmetric session key, without that key ever traveling in a form an eavesdropper could use. From that point on, the connection uses fast symmetric encryption (AES) for all actual data — this is why HTTPS isn't noticeably slower than HTTP for bulk data despite involving 'encryption'.",
          },
          {
            title: "Where this app's own TLS support fits",
            detail:
              "This backend can terminate TLS directly (reading TLS_KEY_PATH/TLS_CERT_PATH) or run plain HTTP behind an upstream terminator (load balancer, reverse proxy, ingress) — both are valid; most real deployments terminate TLS upstream and let the app itself speak plain HTTP on an internal network.",
            sourceRef: "express-production-api/src/server.js (hasTls check) + src/config/index.js (tls.keyPath/certPath)",
          },
        ],
      },
    ],
    closingTip: "Close with the certificate's actual job: it's not what encrypts the data — it's what proves you're actually talking to the server you think you are, before any key exchange happens. Skipping that check is exactly what a man-in-the-middle attack exploits.",
  },
  {
    slug: "hash-collisions-and-why-they-matter",
    question: "What is a hash collision, and why did MD5 and SHA-1 get deprecated for security use?",
    category: "Security",
    round: "general",
    summary:
      "A collision is two different inputs producing the same hash output — theoretically inevitable for any hash (finite output space, infinite inputs), but a SECURE hash makes finding one computationally infeasible. MD5 and SHA-1 stopped meeting that bar.",
    intro: "Advanced-tier — the strongest answer explains WHY collisions are inevitable in principle, then why that's fine in practice until an algorithm's collision resistance is actually broken.",
    sections: [
      {
        heading: "Why collisions are mathematically inevitable, but not a problem by default",
        points: [
          {
            title: "A finite output space, an infinite input space",
            detail:
              "A hash function maps an unbounded set of possible inputs onto a fixed-size output (e.g. 256 bits for SHA-256) — by the pigeonhole principle, collisions MUST exist somewhere. A cryptographically secure hash function doesn't claim collisions are impossible; it claims they're computationally infeasible to intentionally FIND, which is the property that actually matters for security.",
          },
        ],
      },
      {
        heading: "Why MD5 and SHA-1 specifically got deprecated",
        points: [
          {
            title: "Practical collision attacks were demonstrated",
            detail:
              "Researchers found practical methods to deliberately construct two different inputs producing the same MD5 hash, and later the same SHA-1 hash, in realistic time on real hardware — breaking the 'infeasible to find' guarantee those algorithms depended on. That matters concretely for things like digital signatures: an attacker able to construct a second document with the same hash as a legitimately-signed one could substitute it without invalidating the signature. SHA-256 and SHA-3 remain considered secure against this as of now.",
          },
        ],
      },
    ],
    closingTip: "The one detail that shows real understanding: collision resistance isn't a binary 'has them / doesn't have them' property — it's about whether finding one is still computationally infeasible with realistic hardware, which is exactly the property that eroded for MD5 and SHA-1 over time.",
  },
  {
    slug: "hmac-message-integrity-webhooks",
    question: "What is HMAC, and how does it verify a webhook actually came from who it claims to?",
    category: "Security",
    round: "general",
    summary:
      "HMAC combines a hash function with a shared secret key — proving both that a message wasn't tampered with AND that it came from someone holding the secret, which plain hashing alone can't do.",
    intro: "This app has a real webhook signature check already built — walking through that exact code is a stronger answer than describing HMAC in the abstract.",
    sections: [
      {
        heading: "Why a plain hash isn't enough for this",
        points: [
          {
            title: "A plain hash proves integrity, but anyone can compute one",
            detail:
              "If a webhook sender just attached SHA-256(payload) as a 'signature', that proves nothing — an attacker forging a fake webhook could compute the exact same hash for their own fake payload. What's needed is proof the sender holds a SECRET the attacker doesn't have.",
          },
        ],
      },
      {
        heading: "HMAC — a hash, keyed with a shared secret",
        points: [
          {
            title: "HMAC(secret, payload) — only someone holding the secret can produce a valid signature",
            detail:
              "Both sides (Stripe and your server, in this app's case) share a secret. The sender computes HMAC(secret, payload) and attaches it as a signature header. The receiver recomputes HMAC(secret, receivedPayload) independently and checks it matches — a mismatch means either the payload was tampered with in transit, or the sender doesn't actually hold the shared secret (i.e., it's forged).",
            code: `router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    // internally: recomputes HMAC(STRIPE_WEBHOOK_SECRET, req.body) and compares to sig
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send('Webhook signature verification failed'); // reject — not from Stripe, or tampered
  }
  // only reachable once the signature is verified
});`,
            codeLanguage: "javascript",
            relatedLink: { href: "/interview/design-ecommerce-system", label: "The full checkout + webhook flow this sits inside" },
          },
        ],
      },
    ],
    closingTip: "State the two things HMAC proves together, explicitly: 'integrity — the payload wasn't altered — AND authenticity — it came from someone holding the shared secret. A plain hash only ever gives you the first one.'",
  },
  {
    slug: "key-management-at-scale",
    question: "How would you manage encryption keys and secrets across a real production system?",
    category: "Security",
    round: "general",
    summary:
      "Lead/architect level — secrets never live in source control or plain environment files in a serious deployment; a dedicated secrets manager, rotation policy, and least-privilege access to the keys themselves are the actual load-bearing parts of this answer.",
    intro: "This is the question that separates 'knows what encryption is' from 'has actually operated a system that needed to protect real secrets' — the strongest answers focus on operational discipline, not cryptographic algorithms.",
    sections: [
      {
        heading: "Where secrets should never live",
        points: [
          {
            title: "Never in source control, never hardcoded, never in a plain-text .env committed anywhere",
            detail:
              "This repo's own .env is gitignored and only ships a .env.example with placeholder values — the real pattern this represents at production scale, made explicit: environment variables are fine for local dev convenience, but production secrets belong in a dedicated secrets manager (AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager), injected into the running process at deploy/boot time, never persisted to disk in plain text on the host.",
          },
        ],
      },
      {
        heading: "Rotation — a policy, not a one-time setup",
        points: [
          {
            title: "Secrets should be rotatable without a full redeploy, and rotated on a schedule",
            detail:
              "A leaked secret that can't be rotated without significant downtime or a full redeploy is a much bigger incident than one that can be swapped in minutes. Real systems support multiple valid keys simultaneously during a rotation window (old key still verifies while new key starts signing) specifically so rotation doesn't require a synchronized, zero-downtime cutover of every service at once.",
          },
        ],
      },
      {
        heading: "Envelope encryption — for encrypting data at rest at scale",
        points: [
          {
            title: "A key that encrypts other keys, not the data directly",
            detail:
              "Rather than one master key directly encrypting every piece of data (making that key catastrophic to rotate — every encrypted record would need re-encrypting), envelope encryption uses a master key (held in a KMS/HSM) to encrypt per-record or per-file data keys, and those data keys encrypt the actual data. Rotating the master key then only means re-encrypting the small data keys, not the entire dataset.",
          },
        ],
      },
      {
        heading: "Least privilege — who can even reach the keys",
        points: [
          {
            title: "Access to decrypt is itself a permission to audit and restrict",
            detail:
              "Not every service or engineer needs the ability to decrypt every secret — scope access narrowly (this specific service can decrypt this specific key, nothing else), and log/audit every access to a secrets manager the same way you'd audit access to production data itself, since the keys are effectively as sensitive as the data they protect.",
          },
        ],
      },
    ],
    closingTip: "Close by naming the actual failure mode this all prevents: 'a leaked secret that can't be rotated quickly, or a master key whose compromise means re-encrypting the entire dataset, turns a contained incident into a full breach — the operational discipline around keys matters more than which specific algorithm is used.'",
  },
];
