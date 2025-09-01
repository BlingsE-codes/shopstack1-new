import "../styles/terms.css";
import { useEffect } from "react";

export default function Terms() {

   useEffect(() => {
      window.scrollTo(0, 0); // always scroll to top on load
    }, []);
  return (
    <div className="page-container">
      <h1>Terms & Conditions</h1>
      <p>
        Welcome to ShopStackng. By using our app, you agree to the following
        terms and conditions:
      </p>

      <h2>1. Usage</h2>
      <p>
        ShopStackng is designed to help small businesses manage sales, products,
        and expenses. You agree to use it responsibly and lawfully.
      </p>

      <h2>2. Data Privacy</h2>
      <p>
        We value your privacy. Your data will not be shared with third parties
        without your consent, except where required by law.
      </p>

      <h2>3. Limitation of Liability</h2>
      <p>
        ShopStackng is provided “as-is”. While we strive for reliability, we are
        not responsible for losses resulting from downtime or errors.
      </p>

      <h2>4. Updates</h2>
      <p>
        We may update these terms from time to time. Continued use of the app
        implies acceptance of the updated terms.
      </p>
    </div>
  );
}
