import { createThirdwebClient } from "thirdweb";

export const THIRDWEB_CLIENT_ID = "6c238aaac1fef2e8347ec6d35bb0736f";

// Create Thirdweb client for v5
export const client = createThirdwebClient({
  clientId: THIRDWEB_CLIENT_ID,
});
