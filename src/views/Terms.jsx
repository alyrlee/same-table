import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="page-content">
      <div className="pantry-wrap" style={{ maxWidth: 720 }}>
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Terms of Service
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 28 }}>
          Last updated: March 2026
        </p>

        <Section title="1. Acceptance of Terms">
          By accessing or using Health + Heritage ("the App"), you agree to be bound by these Terms of Service.
          If you do not agree to these terms, please do not use the App.
        </Section>

        <Section title="2. Description of Service">
          Health + Heritage provides culturally-rooted nutrition information, recipe alternatives, and meal suggestions
          for Caribbean, Central American, Soul Food, West African, and Haitian cuisines. The App includes recipe browsing,
          nutrition comparison, pantry-based meal suggestions, AI-powered food recognition, and community recipe submission.
        </Section>

        <Section title="3. User Accounts">
          You may use the App as a guest without creating an account. To submit recipes, save favorites, and access
          personalized features, you may create an account via email/password or Single Sign-On (SSO) providers.
          You are responsible for maintaining the confidentiality of your account credentials.
          Guest accounts may be converted to full accounts at any time without losing data.
        </Section>

        <Section title="4. Community Recipe Submissions">
          By submitting a recipe to Health + Heritage, you grant us a non-exclusive, worldwide, royalty-free license to:
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Include the recipe in our open dataset for research and app improvement</li>
            <li>Display the recipe within the App to other users</li>
            <li>Use the recipe data to train machine learning models for nutrition analysis and food recognition</li>
            <li>Share the recipe as part of an open dataset on platforms such as Kaggle and HuggingFace</li>
          </ul>
          <p style={{ marginTop: 8 }}>
            You retain ownership of your submitted content. You represent that you have the right to share any recipe
            you submit and that it does not infringe on any third party's intellectual property.
          </p>
        </Section>

        <Section title="5. Nutrition Information Disclaimer">
          Nutrition data provided by Health + Heritage is sourced from the USDA FoodData Central database, Nutritionix,
          and community contributions. This information is provided for general educational purposes only and should NOT
          be considered medical or dietary advice.
          <p style={{ marginTop: 8 }}>
            <strong>Always consult a qualified healthcare professional or registered dietitian</strong> before making
            significant dietary changes, especially if you have diabetes, hypertension, food allergies, or other
            health conditions. Calorie counts and nutrition values are estimates and may vary based on preparation methods
            and ingredient brands.
          </p>
        </Section>

        <Section title="6. AI-Powered Features">
          The App uses artificial intelligence for food photo recognition, recipe suggestions, and the Heritage Helper chatbot.
          These features provide estimates and suggestions, not definitive answers.
          AI-generated content may contain inaccuracies. Do not rely solely on AI outputs for health decisions.
        </Section>

        <Section title="7. Acceptable Use">
          You agree not to:
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Submit false, misleading, or harmful recipe information</li>
            <li>Attempt to reverse-engineer, scrape, or abuse the API beyond reasonable use</li>
            <li>Use the App to promote products or services without authorization</li>
            <li>Impersonate other users or submit content you do not have rights to share</li>
          </ul>
        </Section>

        <Section title="8. Open Source & Data">
          Health + Heritage is an open-source project. The source code is available under the ISC license.
          The community recipe dataset is shared under the Creative Commons Attribution 4.0 (CC BY 4.0) license.
          Third-party data sources (USDA, Nutritionix, TheMealDB) are subject to their own respective licenses and terms.
        </Section>

        <Section title="9. Limitation of Liability">
          Health + Heritage is provided "as is" without warranties of any kind. We are not liable for any damages
          arising from your use of the App, including but not limited to health outcomes from following recipe
          suggestions or nutrition information provided by the App.
        </Section>

        <Section title="10. Changes to Terms">
          We may update these Terms at any time. Continued use of the App after changes constitutes acceptance
          of the updated terms. We will notify users of significant changes via the App.
        </Section>

        <Section title="11. Contact">
          For questions about these Terms, please open an issue on our GitHub repository or contact us
          through the App's Heritage Helper chat.
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
