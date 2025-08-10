import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPaassword";
import Pricing from "./pages/Pricing";
import Jobs from "./pages/Jobs";
import FAQPage from "./pages/FAQ";
import Profile from "./pages/Profile";
import PaymentSuccess from "./pages/success";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/reset-password" element={<ForgotPassword />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/success" element={<PaymentSuccess />} />
      </Routes>
    </Router>
  );
}

export default App;
