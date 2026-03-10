export default function StaffDashboardHome() {
  return (
    <div>
      <div className="staffTitle">Welcome, Employee Name</div>
      <div className="staffSubtitle">
        This is the staff dashboard foundation. Panels below are placeholders
        for inventory summaries and future widgets.
      </div>

      <div className="staffGrid">
        <div className="staffCard col4">
          <div className="staffCardLabel">Total Catalog Items</div>
          <div className="staffCardValue">00</div>
          <div className="staffCardHint">
            Placeholder for overall item count.
          </div>
        </div>

        <div className="staffCard col4">
          <div className="staffCardLabel">Low Stock Alerts</div>
          <div className="staffCardValue">00</div>
          <div className="staffCardHint">
            Placeholder for items below threshold.
          </div>
        </div>

        <div className="staffCard col4">
          <div className="staffCardLabel">Notifications</div>
          <div className="staffCardValue">0</div>
          <div className="staffCardHint">Placeholder notifications widget.</div>
        </div>

        <div className="staffCard col8">
          <div className="staffCardLabel">Inventory Activity</div>
          <div className="staffCardHint">
            Placeholder panel for charts / trends / recent updates.
          </div>
        </div>

        <div className="staffCard col4">
          <div className="staffCardLabel">Upcoming Tasks</div>
          <div className="staffCardHint">Task 1</div>
          <div className="staffCardHint">Task 2</div>
          <div className="staffCardHint">Task 3</div>
          <div className="staffCardHint">Task 4</div>
          <div className="staffCardHint">Task 5</div>
        </div>

        <div className="staffCard col12">
          <div className="staffCardLabel">Inventory Tracker</div>
          <div className="staffCardHint">
            Placeholder area for category cards / donut charts / breakdowns.
          </div>
        </div>
      </div>
    </div>
  );
}
