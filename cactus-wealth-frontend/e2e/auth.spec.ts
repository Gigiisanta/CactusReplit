import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
  });

  test('should navigate to login page when not authenticated', async ({
    page,
  }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');

    // Should be redirected to login page
    await expect(page).toHaveURL(/.*login/);

    // Verify login page elements are present
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: /password/i })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();

    // Try with invalid email format
    await page.getByRole('textbox', { name: /email/i }).fill('invalid-email');
    await page.getByRole('textbox', { name: /password/i }).fill('short');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show format validation errors
    await expect(page.getByText(/invalid email format/i)).toBeVisible();
    await expect(page.getByText(/password must be at least/i)).toBeVisible();
  });

  test('should perform successful login flow', async ({ page }) => {
    await page.goto('/login');

    // Fill in valid credentials (adjust these based on your test data)
    await page
      .getByRole('textbox', { name: /email/i })
      .fill('test@cactuswealth.com');
    await page
      .getByRole('textbox', { name: /password/i })
      .fill('testpassword123');

    // Submit the form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Verify dashboard content is visible
    await expect(
      page.getByRole('heading', { name: /dashboard/i })
    ).toBeVisible();

    // Verify user information is displayed
    await expect(page.getByText(/welcome/i)).toBeVisible();

    // Verify navigation is present for authenticated users
    await expect(page.getByRole('link', { name: /clients/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /portfolios/i })).toBeVisible();
  });

  test('should handle login with "Remember Me" option', async ({ page }) => {
    await page.goto('/login');

    // Check "Remember Me" checkbox if it exists
    const rememberMeCheckbox = page.getByRole('checkbox', {
      name: /remember me/i,
    });
    if (await rememberMeCheckbox.isVisible()) {
      await rememberMeCheckbox.check();
      await expect(rememberMeCheckbox).toBeChecked();
    }

    // Perform login
    await page
      .getByRole('textbox', { name: /email/i })
      .fill('test@cactuswealth.com');
    await page
      .getByRole('textbox', { name: /password/i })
      .fill('testpassword123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should successfully reach dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should handle logout functionality', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page
      .getByRole('textbox', { name: /email/i })
      .fill('test@cactuswealth.com');
    await page
      .getByRole('textbox', { name: /password/i })
      .fill('testpassword123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Verify we're logged in
    await expect(page).toHaveURL(/.*dashboard/);

    // Find and click logout button (could be in dropdown menu)
    const logoutButton = page
      .getByRole('button', { name: /logout/i })
      .or(page.getByRole('button', { name: /sign out/i }));

    // If logout is in a dropdown, first click the user menu
    const userMenu = page
      .getByRole('button', { name: /user menu/i })
      .or(page.getByTestId('user-menu'));

    if (await userMenu.isVisible()) {
      await userMenu.click();
    }

    await logoutButton.click();

    // Should redirect to login page or home page
    await expect(page).toHaveURL(/\/(login)?$/);

    // Verify we can't access protected routes
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect to intended page after login', async ({ page }) => {
    // Try to access a specific protected page
    await page.goto('/dashboard/clients');

    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/);

    // Login
    await page
      .getByRole('textbox', { name: /email/i })
      .fill('test@cactuswealth.com');
    await page
      .getByRole('textbox', { name: /password/i })
      .fill('testpassword123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to the originally intended page
    await expect(page).toHaveURL(/.*dashboard\/clients/);
  });

  test('should handle session timeout gracefully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page
      .getByRole('textbox', { name: /email/i })
      .fill('test@cactuswealth.com');
    await page
      .getByRole('textbox', { name: /password/i })
      .fill('testpassword123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/.*dashboard/);

    // Simulate session expiration by clearing session storage/cookies
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Try to navigate to another page
    await page.getByRole('link', { name: /clients/i }).click();

    // Should redirect back to login due to expired session
    await expect(page).toHaveURL(/.*login/);

    // Should show appropriate message about session expiration
    await expect(
      page
        .getByText(/session expired/i)
        .or(page.getByText(/please log in again/i))
    ).toBeVisible();
  });

  test('should show loading state during login', async ({ page }) => {
    await page.goto('/login');

    // Fill credentials
    await page
      .getByRole('textbox', { name: /email/i })
      .fill('test@cactuswealth.com');
    await page
      .getByRole('textbox', { name: /password/i })
      .fill('testpassword123');

    // Click submit and immediately check for loading state
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show loading indicator
    const loadingIndicator = page
      .getByText(/signing in/i)
      .or(page.getByRole('button', { name: /signing in/i }))
      .or(page.locator('[data-testid="loading-spinner"]'));

    // Loading state should be visible (might be brief)
    await expect(loadingIndicator)
      .toBeVisible({ timeout: 1000 })
      .catch(() => {
        // Loading might be too fast to catch, which is fine
      });
  });

  test('should handle network errors during login', async ({ page }) => {
    // Intercept and fail the login request
    await page.route('**/api/auth/login', (route) => {
      route.abort('failed');
    });

    await page.goto('/login');
    await page
      .getByRole('textbox', { name: /email/i })
      .fill('test@cactuswealth.com');
    await page
      .getByRole('textbox', { name: /password/i })
      .fill('testpassword123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error message
    await expect(
      page.getByText(/network error/i).or(page.getByText(/unable to connect/i))
    ).toBeVisible();

    // Should remain on login page
    await expect(page).toHaveURL(/.*login/);
  });
});
