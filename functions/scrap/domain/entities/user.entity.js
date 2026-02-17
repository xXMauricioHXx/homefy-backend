const {
  NoCreditsAvailableException,
} = require("../exceptions/no-credits-available.exception");

class User {
  constructor(data) {
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.photoUrl = data.photoUrl || null;
    this.createdAt = data.createdAt?.toDate() || new Date();
    this.updatedAt = data.updatedAt?.toDate() || new Date();
    this.id = data.id;
    this.plan = data.plan
      ? {
          name: data.plan?.name,
          credits: data.plan?.credits,
          expiresAt: data.plan?.expiresAt?.toDate(),
          stripeCustomerId: data.plan?.stripeCustomerId || null,
          stripeSubscriptionId: data.plan?.stripeSubscriptionId || null,
          stripePriceId: data.plan?.stripePriceId || null,
          status: data.plan?.status || "active",
        }
      : this.freePlan();

    this.validate();
  }

  freePlan() {
    return {
      name: "gratuito",
      credits: 1,
      expiresAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      status: "active",
    };
  }

  setPlan(plan) {
    this.plan = {
      name: plan.name,
      credits: plan.credits,
      expiresAt: plan.expiresAt,
      stripeCustomerId: plan.stripeCustomerId || null,
      stripeSubscriptionId: plan.stripeSubscriptionId || null,
      stripePriceId: plan.stripePriceId || null,
      status: plan.status || "active",
    };
  }

  getId() {
    return this.id;
  }

  getPlan() {
    return this.plan;
  }

  validate() {
    if (!this.id || this.id.trim() === "") {
      throw new Error("ID is required");
    }

    if (!this.name || this.name.trim() === "") {
      throw new Error("Name is required");
    }

    if (!this.email || this.email.trim() === "") {
      throw new Error("Email is required");
    }

    if (!this.phone || this.phone.trim() === "") {
      throw new Error("Phone is required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new Error("Invalid email format");
    }
  }

  toFirestore() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      photoUrl: this.photoUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      plan: {
        name: this.plan.name,
        credits: this.plan.credits,
        expiresAt: this.plan.expiresAt || null,
        stripeCustomerId: this.plan.stripeCustomerId || null,
        stripeSubscriptionId: this.plan.stripeSubscriptionId || null,
        stripePriceId: this.plan.stripePriceId || null,
        status: this.plan.status || "active",
      },
    };
  }

  useCredit() {
    if (this.plan.credits <= 0) {
      throw new NoCreditsAvailableException("No credits available");
    }
    this.plan.credits--;
  }
}

module.exports = {
  User,
};
