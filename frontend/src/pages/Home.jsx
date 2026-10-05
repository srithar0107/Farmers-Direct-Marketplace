import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { homeFor } from "../api.js";

export default function Home() {
  const { user } = useAuth();
  return (
    <>
      <div className="hero">
        <div className="crops">🍇 🍌 🌾 🥭 🥛</div>
        <h1 className="display-5">Fresh from the farm, straight to you</h1>
        <p className="lead">
          Farmers list their own harvest. Customers buy directly from them,
          with fewer middlemen in between.
        </p>
        {user ? (
          <Link className="btn btn-light btn-lg" to={homeFor(user.role)}>Go to my page</Link>
        ) : (
          <>
            <Link className="btn btn-light btn-lg me-2" to="/register">Join now</Link>
            <Link className="btn btn-outline-light btn-lg" to="/login">Login</Link>
          </>
        )}
      </div>

      <h2 className="text-center mt-5 mb-4">How it works</h2>
      <div className="row g-4 text-center">
        {[
          ["🧑‍🌾", "Farmers", "List your crops with price, quantity and location. Update or remove them anytime."],
          ["🛒", "Customers", "Search the marketplace, see who grew each product and contact the farmer."],
          ["🛡️", "Admin", "Manage users and products to keep the marketplace trustworthy."]
        ].map(([icon, title, text]) => (
          <div className="col-md-4" key={title}>
            <div className="card h-100">
              <div className="card-body">
                <div className="step-icon">{icon}</div>
                <h5 className="card-title mt-2">{title}</h5>
                <p className="card-text">{text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="strip">
        <h4 className="mb-1">Grown by farmers. Chosen by you.</h4>
        <p className="mb-0">Grapes, bananas, grains, vegetables and more, straight from the field.</p>
      </div>
    </>
  );
}