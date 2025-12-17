import Link from "next/link";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand Section */}
          <div className={styles.brand}>
            <h3 className={styles.brandName}>Realm of Legends</h3>
            <p className={styles.brandDescription}>
              The ultimate gaming social network for connecting gamers worldwide
            </p>
          </div>

          {/* Quick Links */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Platform</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href="/feed" className={styles.link}>
                  Feed
                </Link>
              </li>
              <li>
                <Link href="/games" className={styles.link}>
                  Games
                </Link>
              </li>
              <li>
                <Link href="/groups" className={styles.link}>
                  Groups
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className={styles.link}>
                  Marketplace
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Features</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href="/subscription" className={styles.link}>
                  Premium
                </Link>
              </li>
              <li>
                <Link href="/streams" className={styles.link}>
                  Live Streams
                </Link>
              </li>
              <li>
                <Link href="/news" className={styles.link}>
                  Gaming News
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Support</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href="/legal/contact" className={styles.link}>
                  Contact Us
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@realmoflegends.info"
                  className={styles.link}>
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="mailto:bugs@realmoflegends.info"
                  className={styles.link}>
                  Report Bug
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={styles.bottom}>
          <div className={styles.legal}>
            <Link href="/legal/privacy" className={styles.legalLink}>
              Privacy Policy
            </Link>
            <span className={styles.separator}>•</span>
            <Link href="/legal/terms" className={styles.legalLink}>
              Terms of Service
            </Link>
            <span className={styles.separator}>•</span>
            <Link href="/legal/contact" className={styles.legalLink}>
              Contact & Support
            </Link>
          </div>

          <div className={styles.copyright}>
            © {new Date().getFullYear()} Realm of Legends. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
