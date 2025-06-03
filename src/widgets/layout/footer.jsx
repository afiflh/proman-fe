import PropTypes from "prop-types";
import { Typography } from "@material-tailwind/react";

export function Footer({ brandName, routes }) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 pt-5">
      <div className="container mx-auto flex flex-wrap items-center justify-between font-poppins">
        <Typography
          variant="small"
          className="text-xs text-gray-600 font-poppins"
        >
          &copy; {year} PT Intelix Global Crossing |{" "}
          Made by{" "}
          <span className="font-normal text-blue-600">
            {brandName}
          </span>{" "}
        </Typography>
        <ul className="flex flex-wrap items-center gap-4">
          {routes.map(({ name }) => (
            <li key={name}>
              <span>
                <Typography
                  as="span"
                  variant="small"
                  className="text-xs text-gray-600 transition-colors hover:text-blue-500"
                >
                  {name}
                </Typography>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

Footer.defaultProps = {
  brandName: "Project Management Team",
  routes: [],
};

Footer.propTypes = {
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
  })),
};

export default Footer;
