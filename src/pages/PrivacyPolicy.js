import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#202d33] p-8 rounded-lg shadow-lg text-neutral-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">
            Privacy Policy & Internal Use Policy
          </h1>
          <Link
            to="/login"
            className="text-emerald-500 hover:text-emerald-400 text-sm font-medium"
          >
            ← Back to Login
          </Link>
        </div>

        <div className="space-y-6 text-gray-300 leading-relaxed overflow-y-auto max-h-[80vh] pr-2">
          <section className="bg-emerald-900/20 p-4 rounded-lg border border-emerald-800/30">
            <h2 className="text-xl font-bold text-emerald-400 mb-2">
              Internal Use Only
            </h2>
            <p className="font-medium text-white">
              This application is a proprietary internal tool designed
              exclusively for{" "}
              <a
                href="https://thecapitalavenue.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 underline hover:text-emerald-300"
              >
                The Capital Avenue Real Estate
              </a>
              .
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Access is strictly restricted to authorized employees and agents
              of The Capital Avenue. Unauthorized access or use by individuals
              outside the organization is prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">
              1. Application Overview
            </h2>
            <p>
              This platform is our central hub for managing client
              communications and real estate operations via the WhatsApp
              Business API. It integrates various technologies to streamline our
              workflow:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong className="text-white">WhatsApp Business API:</strong>{" "}
                We use this to send and receive messages securely, manage
                templates, and handle high-volume client interactions.
              </li>
              <li>
                <strong className="text-white">Team Inbox (Replies):</strong> A
                shared dashboard for our agents to view and respond to client
                messages in real-time.
              </li>
              <li>
                <strong className="text-white">
                  CRM & Contact Management:
                </strong>{" "}
                Storing client details, managing enquiries, and tracking lead
                status within our secure database.
              </li>
              <li>
                <strong className="text-white">Automation & Bots:</strong>{" "}
                Utilizing our custom "Bot Studio" and "Flow Builder" to create
                automated conversational flows and auto-replies to assist
                clients instantly.
              </li>
              <li>
                <strong className="text-white">Campaign Management:</strong>{" "}
                Tools to create, schedule, and analyze marketing campaigns sent
                to our subscriber lists.
              </li>
              <li>
                <strong className="text-white">Property Management:</strong> A
                dedicated module for managing our real estate listings and
                sharing them with clients.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">
              2. Data Privacy & Usage
            </h2>
            <p>As this is an internal application:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>Client Data:</strong> All client information entered or
                collected is owned by The Capital Avenue Real Estate and is used
                solely for business purposes.
              </li>
              <li>
                <strong>No Third-Party Sharing:</strong> We do not share client
                or usage data with external third parties, except as required
                for the functionality of the WhatsApp Business API (Meta).
              </li>
              <li>
                <strong>Security:</strong> All accounts are protected via
                industry-standard authentication. Usage is monitored to ensure
                compliance with company policies.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">
              3. Contact Information
            </h2>
            <p>
              For any questions regarding access, technical support, or privacy
              concerns, please contact our administration:
            </p>
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <p className="mb-2">
                <span className="text-gray-400">Organization:</span>{" "}
                <a
                  href="https://thecapitalavenue.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-emerald-400"
                >
                  The Capital Avenue Real Estate
                </a>
              </p>
              <p className="mb-2">
                <span className="text-gray-400">Technical Contact 1:</span>{" "}
                <a
                  href="mailto:mhd.siraj@thecapitalavenue.com"
                  className="text-emerald-400 hover:underline"
                >
                  mhd.siraj@thecapitalavenue.com
                </a>
              </p>
              <p>
                <span className="text-gray-400">Technical Contact 2:</span>{" "}
                <a
                  href="mailto:muhammedsiraj274@gmail.com"
                  className="text-emerald-400 hover:underline"
                >
                  muhammedsiraj274@gmail.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
