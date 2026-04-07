const { chromium } = require("@playwright/test");

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3002";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "adminhemzexport@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "HEMZ@110";

async function textOrNull(locator) {
  try {
    return (await locator.textContent())?.trim() || null;
  } catch {
    return null;
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const findings = [];
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle" });
    await page.waitForSelector('[role="listitem"]', { timeout: 15000 });

    const productCards = page.locator('[role="listitem"]');
    const productCount = await productCards.count();
    console.log(`Storefront products visible: ${productCount}`);

    if (productCount === 0) {
      findings.push("No products rendered on storefront /products page.");
    } else {
      let purchasableCard = null;
      let addToCartButton = null;

      for (let index = 0; index < productCount; index += 1) {
        const candidateCard = productCards.nth(index);
        await candidateCard.hover();
        const candidateButton = candidateCard.getByRole("button", { name: /add to cart/i }).last();
        if (await candidateButton.isEnabled()) {
          purchasableCard = candidateCard;
          addToCartButton = candidateButton;
          break;
        }
      }

      if (purchasableCard && addToCartButton) {
        await addToCartButton.click();
        await page.goto(`${BASE_URL}/cart`, { waitUntil: "networkidle" });
        const cartTitle = await textOrNull(page.getByRole("heading", { name: /shopping cart/i }));
        console.log(`Cart page heading after add-to-cart: ${cartTitle}`);

        await page.getByRole("button", { name: /proceed to checkout/i }).click();
        await page.waitForLoadState("networkidle");
        const redirectedUrl = page.url();
        console.log(`Guest checkout redirect URL: ${redirectedUrl}`);
        if (!redirectedUrl.includes("/login?redirect=%2Fcheckout") && !redirectedUrl.includes("/login?redirect=/checkout")) {
          findings.push(`Guest checkout did not redirect to login. Landed on: ${redirectedUrl}`);
        }
      } else {
        findings.push("First storefront product card could not be added to cart in E2E run.");
      }

      await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle" });
      await productCards.first().click();
      await page.waitForLoadState("networkidle");
      const detailBodyText = await textOrNull(page.locator("body"));
      const currencySnippet = detailBodyText?.match(/Currency:[^\n]*/)?.[0] || null;
      console.log(`Product detail currency snippet: ${currencySnippet}`);
      if (currencySnippet && /Currency:\s*(undefined)?\s*$/.test(currencySnippet)) {
        findings.push("Product detail page renders an empty Currency field.");
      }
    }

    await page.goto(`${BASE_URL}/admin-login`, { waitUntil: "networkidle" });
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /^login$/i }).click();
    await page.waitForURL(/\/admin$/, { timeout: 15000 });
    console.log(`Admin login landed on: ${page.url()}`);

    await page.goto(`${BASE_URL}/admin/products/new`, { waitUntil: "networkidle" });
    const timestamp = Date.now();
    const tempTitle = `QA Temp Product ${timestamp}`;

    await page.getByLabel(/product title/i).fill(tempTitle);
    await page.getByLabel(/^product type$/i).fill("QA Shawl");
    await page.getByLabel(/^material$/i).fill("QA Material");
    await page.getByLabel(/^price/i).fill("123.45");
    await page.getByLabel(/discount/i).fill("10");
    await page.getByLabel(/minimum order qty/i).fill("5");
    await page.getByLabel(/lead time/i).fill("9");
    await page.locator("#availability").selectOption("OutOfStock");
    await page.getByLabel(/product description/i).fill("Temporary QA product description");
    await page.getByRole("button", { name: /create product/i }).click();

    try {
      await page.waitForURL(/\/admin\/products$/, { timeout: 10000 });
    } catch {
      console.log(`Admin create did not return to list. Current URL: ${page.url()}`);
      const createError = await textOrNull(page.locator("form"));
      console.log(`Admin create form snapshot: ${createError?.slice(0, 400)}`);
      throw new Error("Admin product creation flow did not complete with the expected redirect.");
    }

    await page.getByPlaceholder(/search products/i).fill(tempTitle);
    await page.waitForLoadState("networkidle");
    const tempRow = page.locator("table tbody tr", { hasText: tempTitle }).first();
    await tempRow.waitFor({ timeout: 15000 });
    await tempRow.getByRole("link").click();
    await page.waitForLoadState("networkidle");

    const actualIdValue = await page.locator("#id").inputValue();
    const availabilityValue = await page.locator("#availability").inputValue();
    console.log(`Created product actual ID: ${actualIdValue}`);
    console.log(`Created product availability value on edit form: ${availabilityValue}`);

    if (!actualIdValue) {
      findings.push("Admin edit form did not show the saved product system ID.");
    }

    if (availabilityValue !== "OutOfStock") {
      findings.push(`Admin create form saved availability incorrectly. Selected "OutOfStock" but edit form shows "${availabilityValue}".`);
    }

    await page.getByLabel(/discount/i).fill("25");
    await page.getByRole("button", { name: /save changes/i }).click();

    let persistedDiscount;
    try {
      await page.waitForURL(/\/admin\/products$/, { timeout: 10000 });
      await page.getByPlaceholder(/search products/i).fill(tempTitle);
      await page.waitForLoadState("networkidle");
      const updatedRow = page.locator("table tbody tr", { hasText: tempTitle }).first();
      await updatedRow.waitFor({ timeout: 15000 });
      await updatedRow.getByRole("link").click();
      await page.waitForLoadState("networkidle");
      persistedDiscount = await page.getByLabel(/discount/i).inputValue();
    } catch {
      console.log(`Admin save did not return to list. Current URL: ${page.url()}`);
      persistedDiscount = await page.getByLabel(/discount/i).inputValue();
    }

    console.log(`Persisted discount after edit save: ${persistedDiscount}`);
    if (persistedDiscount !== "25") {
      findings.push(`Admin product discount edit did not persist. Saved 25 but form reloaded with ${persistedDiscount}.`);
    }
  } finally {
    await browser.close();
  }

  console.log("\nE2E Findings:");
  if (findings.length === 0) {
    console.log("No issues detected in the exercised product flows.");
  } else {
    findings.forEach((finding, index) => {
      console.log(`${index + 1}. ${finding}`);
    });
  }
}

run().catch((error) => {
  console.error("E2E run failed:", error);
  process.exit(1);
});
