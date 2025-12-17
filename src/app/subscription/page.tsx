import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import { GlowCard } from "@/components/ui/GlowCard";
import styles from "./subscription.module.css";

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscription: true,
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  const subscription = user?.subscription;

  return (
    <div className={styles.subscriptionPage}>
      <div className="container mx-auto px-4 py-8">
        <div className={styles.header}>
          <h1>Subscription & Billing</h1>
          <p>Manage your subscription and view billing history</p>
        </div>

        {subscription && subscription.tier !== "free" && (
          <GlowCard className={styles.currentSubscription} glowColor="accent">
            <h2>Current Subscription</h2>
            <div className={styles.subscriptionDetails}>
              <div className={styles.tier}>
                <span>Plan:</span>
                <span className={styles.tierName}>
                  {subscription.tier.toUpperCase()}
                </span>
              </div>
              <div className={styles.status}>
                <span>Status:</span>
                <span
                  className={`${styles.statusBadge} ${
                    styles[subscription.status]
                  }`}>
                  {subscription.status.toUpperCase()}
                </span>
              </div>
              {subscription.currentPeriodEnd && (
                <div className={styles.period}>
                  <span>Next billing:</span>
                  <span>
                    {new Date(
                      subscription.currentPeriodEnd
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
              {subscription.cancelAtPeriodEnd && (
                <div className={styles.cancellation}>
                  <span>
                    ⚠️ Subscription will end on{" "}
                    {new Date(
                      subscription.currentPeriodEnd!
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </GlowCard>
        )}

        <SubscriptionPlans
          currentTier={subscription?.tier || "free"}
          currentStatus={subscription?.status}
        />

        {user?.transactions && user.transactions.length > 0 && (
          <GlowCard className={styles.billingHistory}>
            <h2>Billing History</h2>
            <div className={styles.transactions}>
              {user.transactions.map((transaction) => (
                <div key={transaction.id} className={styles.transaction}>
                  <div className={styles.transactionInfo}>
                    <div className={styles.transactionDescription}>
                      {transaction.description ||
                        transaction.type.replace("_", " ")}
                    </div>
                    <div className={styles.transactionDate}>
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={styles.transactionAmount}>
                    <span
                      className={`${styles.statusBadge} ${
                        styles[transaction.status]
                      }`}>
                      {transaction.status}
                    </span>
                    <span className={styles.amount}>${transaction.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlowCard>
        )}
      </div>
    </div>
  );
}
