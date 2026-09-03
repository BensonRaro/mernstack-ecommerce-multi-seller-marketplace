<!-- Always include "read /AGENTS.md" -->

1. read /AGENTS.md and Let's begin by setting up our **Express** backend and configuring **Nodemon** for development. Express will power our REST API throughout this project, while Nodemon automatically restarts the server whenever we make changes, giving us a faster development workflow. We'll create our server entry point, configure the development scripts, and verify that our Express server is running successfully on port **5000** before we start building the Multi-user Ecommerce platform.

2. read /AGENTS.md and Now that our Express server is up and running, let's configure the essential middleware that every production-ready backend should have. We'll load environment variables with Dotenv, secure our API using Helmet, configure CORS to safely handle requests from our frontend, enable Cookie Parser for authentication, and add Express middleware to parse incoming JSON and form data. By the end of this step, our backend will be secure, well-configured, and ready to start building features.

3. read /AGENTS.md and https://cdn.dribbble.com/userupload/17316082/file/original-90afec4937436c219f40a2d7be301001.png?resize=752x&vertical=center and design a sign up page - Only Google

4. Add a Toaster, redesign signup error and add comfirm password. Also check why rounded is not working or increase it globally.

5. Using react-router layout add signin page -reference signup design. If user is signed in they should not be able to visit auth layout(signin and signup)

6. read /AGENTS.md and https://i.pinimg.com/736x/1e/67/e3/1e67e30664aea9284d9868dcb3aafdcf.jpg, let start by only designing the header - Used Globally.

7. Based on the image choose the theme - tomato but choose the color used on the image the update the shadcn ui theme in app.css

8. On the header if the user is login show image if available if not show name else show login button. If user is not login show login button. On click of login button redirect to signin page.

9. Hero section

10. on the Hero Image use public/hero-image.png

11. create categories constant - app/constants/categories.ts that will be later when creating the products, on https://i.pinimg.com/736x/1e/67/e3/1e67e30664aea9284d9868dcb3aafdcf.jpg we will display the categories after the hero section - reference the image for the categories.

12. read /AGENTS.md and create roles - seller, buyer, admin. Use better-auth admin plugin.

13. read /AGENTS.md and setup uploadthing - doc: https://docs.uploadthing.com/backend-adapters/express

14. read /AGENTS.md and create a seller using a dialog - no seller model(name,image,description) - choose where the button will be to open dialog. Remember later admin will be able to approve the seller. Use uploadthing for image upload. Use shadcn ui dialog - Customize if fully coz we want something unique.

15. create a middleware to protect api/seller route for only authenticated users.

16. Redesign choose file on the seller's dialog

17. Let intergrate our project with tanstack query for a production-ready mutation and query - make changes to the project to use tanstack query for all api calls. Use react-query devtools for development. - tanstack-query already installed

18. read /AGENTS.md and if the seller is approved, show the link on the user dropdown to go to the seller dashboard. If not approved show a message that the seller is not approved yet(only if the th seller have been created by the user).

19. read /AGENTS.md and create a seller dashboard layout - use react-router layout. The seller dashboard will have a sidebar with links to the products, create-product, orders, and settings pages. Use shadcn ui components for the layout and customize it to match the overall design of the application.

20. read /AGENTS.md and create a product model with the following fields: name, description, price, discount, category, image, and seller (reference to the seller model). Then design the create product page.

- backend functionality should live in the controller folder so that we can have routes in /routes. Also guard these routes(only seller should use them - use a middleware)

21. redesign create product page - and read https://cdn.dribbble.com/userupload/13298939/file/original-93c3eb1de8d279bda7c111b072c93038.png?resize=752x&vertical=center

- some other fields may be added to the product model like stock, color, size, multiple images - decide if we should have a thumbnail image for the product card later, gender, product status
- use shadcn ui components but customize them build a unique design based on the image above. Use uploadthing for image upload. Use tanstack query for api calls.

22. read /AGENTS.md and create products page - with pagination and search functionality. Use tanstack query for api calls. Use shadcn ui components but customize them to match the overall design of the application.

- we will allow export to csv or json for the products.
- reference: https://cdn.dribbble.com/userupload/47010886/file/e5c1828319b4440e484600da1d4e8b23.png?resize=1024x768&vertical=center
- since pagination and search will be reused, create a reusable component for them. Use shadcn ui components but customize them to match the overall design of the application.

23. read /AGENTS.md for delete product let add an alert dialog to confirm the delete action. Use shadcn ui components but customize them to match the overall design of the application.
    Then we handle edit product - we will use the same create product page for editing the product. We will prefill the form with the product data. Use tanstack query for api calls.

24. on the home page, we will add new arrivals section - we will display the latest products added by the sellers. Use tanstack query for api calls. Creacte a reusable product card component.

- for the new arrivals section and products card - reference: https://i.pinimg.com/736x/1e/67/e3/1e67e30664aea9284d9868dcb3aafdcf.jpg

25. remove scrollbar globally. - No scrollbar should be visible on the entire application.

26. read /AGENTS.md and we will create cart and wishlist using Zustand - already installed. the products will be displayed in shadcn ui drawer. The user will be able to add products to the cart and wishlist from the product card. The user will also be able to remove products from the cart(also update quantity) and wishlist. Use shadcn ui components but customize them to match the overall design of the application.

- for mobile view use a bottom drawer for the cart and wishlist. For desktop view use a right drawer for the cart and wishlist.
- the drawers should undocked

27. read /AGENTS.md and create a checkout page - reference: https://cdn.dribbble.com/userupload/46733962/file/817662a4a4cc40dc563db7d5d1b45198.png?resize=752x&vertical=center

- delivery status: pickup, delivery
- for address and phone design it the way it's on the image above. Later on the user profile we will allow the user to add multiple addresses and phone numbers. The user will be able to choose from the saved addresses and phone numbers on the checkout page.
- Include promo code field - we will create a promo model later on. The user will be able to enter a promo code and if it's valid, we will apply the discount to the total amount.
- payment method: cash on delivery, stripe
- if the user choose stripe, we will redirect the user to stripe checkout page. After successful payment, we will redirect the user to the order confirmation page.
- use better-auth stripe webhook to update payment status: pending, paid, failed.
- STRIPE_WEBHOOK_SECRET and STRIPE_SECRET_KEY are already added to the .env file.
- bun add @better-auth/stripe and bun add stripe@^22.0.0 already added to the backend.

28. read /AGENTS.md and let handle promo code on the sellers dashboard also update the checkout page - to use sellers' promo code.

29. Build the sellers orders page. On the orders page include pagination and search
30. If we have a lot of ordered items can we use: https://dribbble.com/shots/26865303-Order-history collapse/expand feature for each order to show the ordered items.

31. build sellers setting page

32. read https://cdn.dribbble.com/userupload/48002505/file/9c1c547ccb2f2381e3b874d8da368227.png?resize=752x1212&vertical=center and https://cdn.dribbble.com/userupload/48671419/file/69942c6296b7d4c72d312e0844ca53d6.png?resize=1024x683&vertical=center build a products details page - later we will add a review section to the product details page(don't build it yet just consider it).

33. let handle product review - only authenticated and users who have purchased the product can leave a review. The review will have a rating and a comment. The user will be able to edit and delete their own reviews. The reviews will be displayed on the product details page - coming soon section. Use tanstack query for api calls. Use shadcn ui components but customize them to match the overall design of the application.

- let have one review but they can leave comments afterward without review(rating the product). So that we can have something a thread.

34. sellers page(/:username) - we need to have a unique username, the backend and frontend areas need to changed to accommodate this. We have an avarage rating for the seller based on the products reviews. The user will be able to see the sellers products, reviews. Use tanstack query for api calls. Use shadcn ui components but customize them to match the overall design of the application.

35. seller's dashboard - as the home page for the seller. telling the seller everything they need to know about their store. We will display the total number of products, total number of orders, total revenue, and average rating. We will also display a chart showing the sales over time. Use tanstack query for api calls. Use shadcn ui components but customize them to match the overall design of the application.

36. Let add Best Seller on the dashboard read: https://i.pinimg.com/736x/1e/67/e3/1e67e30664aea9284d9868dcb3aafdcf.jpg

- Best seller should be displayed on the home page and seller dashboard, using the productcard on the image

37. update the product cards to load real product ratings based on their reviews. Also card display the wrong sold(sales) items.

38. shop page - we will display all the products from the sellers. The user will be able to filter the products by category, price, and rating. The user will also be able to sort the products by price, rating, and newest. Use tanstack query for api calls. Use shadcn ui components but customize them to match the overall design of the application.

- Since it may be a large number of products, we will use pagination and search functionality.
- read: https://cdn.dribbble.com/userupload/16527214/file/original-30290b90691fcf1644a9b0ed03e1eaad.png?resize=1024x768&vertical=center

- the issue is we are using /{route-name} for seller
- FIX: /shop to display the shop instead of seller
- filter drawer is not fully displaying - some part of the left side are not visible

39. read AGENTS.md and build user profile page - we will display the user's profile information, orders(seller order can be reused except the functionality), and reviews. Use tanstack query for api calls. Use shadcn ui components but customize them to match the overall design of the application.

- setting is where we will display user's profile - no editing
- user address and phone number CRUD - Afterward update checkout page to use real address and phone number
- the model is taking a lot of time, let change it

read AGENTS.md, profile page

- Header missing
- backend/src/routes/user.ts - should contain only the routes while the functionality go to backend/src/controllers/user.ts
- I have one review but it's not displaying on reviews tab
- phone diolog has an issue, opens correct, but onclick on any are it closes - recommend to use shadcn diolog like other sections of the codebase.
- No option to add address. Also make sure checkout page phone number and address was updated to use user information(phone number and address).
- on the orders tab, I liked the design used on the sellers orders page - maybe it can be reused or changed to a rolebased one.

- On profile page, all save buttons are off the dialog, also edit buttons are available even though the phone number and address are empty.
- Checkout page is not using the real user address and phone number. It should be updated to use the real user information. - Currently using the constants/static/sample data. The user should be able to select from their saved addresses and phone numbers on the checkout page. If they don't have any saved addresses or phone numbers, they should be prompted to add them before proceeding with the checkout.

- Fix: Remaining errors are pre-existing in codebase (ProductCard, ProductInfo, seller orders/products, shop)
- On phone number and email and address delete - let use alert like other sections of the code base.
- Update the checkout page to display the default address and phone number - as well as an option to change - directing user to their profile page.
- On the profile page - order tab let have some border and shadow
- fix an error when loading profile page

40. Admin page
    read /AGENTS.md, using react-router layout(admin-only), we create routes - Dashboard, users, Products - placeholder for now.

- Intergrate the route with sidebar just like the seller layout.

41. add a new route for seller in the admin sidebar - include filter(by approval status and search) and pagination, approve/reject. Use tanstack query for api calls. Use shadcn ui components but customize them to match the overall design of the application.

- If it's revoking a seller, we should also revoke all their products. If a seller is revoked or not approved, their product should not be displayed on any page.
- When revoking a seller, let a reason be provided for the revocation. The reason should be displayed on the seller's dashboard and profile page. The seller should not be able to create new products or edit existing products or delete products and create promo codes if they are revoked.
- We should should be having another seller status - revoked(even though I roked a seller it display pending). The seller should be able to see the reason for the revocation on their dashboard and profile page. The seller should not have any CRUD permissions if they are revoked. Means admin cannot revoke a seller who is yet to be approved.
  read /AGENTS.md - if a seller is revoked -
  - Displaying rekoved reason to seller's pages
  - seller should not be able to update,create,delete products or promo codes.
  - if the seller is revoked, they should be able to visit their dashboard, on the user dropdown it shouldnt display "Seller account pending approval" as prevous the seller was approved - seller should be able to visit the page

42. build admin all users page - include filter(by role and search) and pagination, ban. Use tanstack query for api calls. Use shadcn ui components but customize them to match the overall design of the application.

43. build admin all products page - include filter(by category and search) and pagination, approve/reject. Use tanstack query for api calls. Use shadcn ui components but customize them to match the overall design of the application.

44. Build admi dashboard.

45. we need to send the user an email after a very important change e.g prdoct been reject, order status change, seller status change etc
    design a custom email template for our emails.
    use:
    ``
    import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resendClient.emails.send({
      from: "Resend <onboarding@resend.dev>",(don't make changes here - must remain the same so as to work)
      to: ["developerspack.team@gmail.com"],(don't make changes here - must remain the same so as to work)
      subject: subject,
      html: html,
    });

``

46. intergrate inngest

47. Seller's ai-insight page

. Advise on on which products to add to their store.
. Summarize the seller's feedback.

- We will use gemini ai api
- Each ai insight can be triggered using a button
- Server-Sent Events (SSE) to make actions real-time
- both actions should run on inngest
  GEMINI_API_KEY already added to the backend/.env

the issue was the model - fix but inngest function are not triggered, meaning the functions are not running in an inngest function.

48. make sure both backend and frontend are ready for vercel deployment.

the issue was on the backend we were using BETTER_AUTH_URL with the vercel backend url, we should be using the vercel frontend url. Since we are using vercel rewrites.
