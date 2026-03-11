import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="page-content">
      <div className="pantry-wrap" style={{ maxWidth: 720 }}>
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Privacy Policy
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 28 }}>
          Last updated: March 2026
        </p>

        <Section title="1. Information We Collect">
          <strong>Account Information:</strong> When you create an account, we collect your email address, name,
          and authentication credentials. SSO users share the information permitted by their provider (Google, Apple, etc.).
          <p style={{ marginTop: 8 }}>
            <strong>Guest Users:</strong> Guest accounts do not require any personal information. A temporary identifier
            is created and stored only on your device.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>Usage Data:</strong> We collect anonymous usage patterns (pages viewed, features used) to improve
            the App. We do not sell this data to third parties.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>Recipe Submissions:</strong> Recipes you submit are stored on our servers and may be included in
            our open dataset. Photos you upload are stored securely.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>Pantry Data:</strong> Your pantry ingredients are stored locally on your device using IndexedDB.
            This data is not sent to our servers unless you choose to use meal suggestion features.
          </p>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul style={{ paddingLeft: 20 }}>
            <li>To provide and personalize the App experience</li>
            <li>To generate meal suggestions based on your pantry ingredients</li>
            <li>To build and improve our open-source cultural recipe dataset</li>
            <li>To train machine learning models for food recognition and nutrition analysis</li>
            <li>To improve the App's features and fix bugs</li>
          </ul>
        </Section>

        <Section title="3. Data Storage & Security">
          <ul style={{ paddingLeft: 20 }}>
            <li>Passwords are hashed using bcrypt before storage — we never store plain-text passwords</li>
            <li>Authentication uses JWT tokens with configurable expiration</li>
            <li>The App works offline — your pantry data and saved recipes are stored locally in your browser's IndexedDB</li>
            <li>Uploaded images are stored on our server and are not shared with third parties beyond what is described in our Terms</li>
          </ul>
        </Section>

        <Section title="4. Third-Party Services">
          We use the following third-party services to provide nutrition data and AI features:
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li><strong>USDA FoodData Central:</strong> Nutrition lookup (U.S. government, public domain)</li>
            <li><strong>Nutritionix:</strong> Natural language nutrition analysis (subject to their privacy policy)</li>
            <li><strong>HuggingFace:</strong> AI food image recognition via CLIP model (subject to their privacy policy)</li>
            <li><strong>TheMealDB:</strong> Recipe data source (Creative Commons)</li>
          </ul>
          <p style={{ marginTop: 8 }}>
            When you use food recognition features, your image is sent to HuggingFace for processing.
            When you look up nutrition, your query is sent to USDA and/or Nutritionix.
          </p>
        </Section>

        <Section title="5. Open Dataset">
          Recipes submitted by users may be included in our open dataset published on Kaggle and HuggingFace.
          This dataset is released under Creative Commons Attribution 4.0 (CC BY 4.0).
          <p style={{ marginTop: 8 }}>
            Submitted recipes are de-identified — your personal account information is never included in the dataset.
            Only the recipe name, culture, ingredients, instructions, photo, and nutrition data are shared.
          </p>
        </Section>

        <Section title="6. Your Rights">
          <ul style={{ paddingLeft: 20 }}>
            <li><strong>Access:</strong> You can view all data associated with your account at any time</li>
            <li><strong>Correction:</strong> You can update your profile and recipe submissions</li>
            <li><strong>Deletion:</strong> You can delete your account and all associated data by contacting us</li>
            <li><strong>Portability:</strong> You can export your data using the dataset export feature</li>
            <li><strong>Withdrawal:</strong> You can request removal of your submitted recipes from the open dataset</li>
          </ul>
        </Section>

        <Section title="7. Children's Privacy">
          Health + Heritage is not directed at children under 13. We do not knowingly collect personal information
          from children under 13. If you believe a child has provided us with personal information, please contact us.
        </Section>

        <Section title="8. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify users of significant changes via the App.
          Your continued use of the App after changes constitutes acceptance of the updated policy.
        </Section>

        <Section title="9. Contact">
          For privacy inquiries, please open an issue on our GitHub repository or contact us through the App.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
        {title}
      </h3>
      <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--charcoal)' }}>
        {children}
      </div>
    </div>
  );
}
