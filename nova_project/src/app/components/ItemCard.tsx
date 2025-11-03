"use client";

type Item = {
    id: number;
    itemName: string;
    category: string;
    description: string;
    unitCost: number;
    imageUrl: string;
    stock: number;
    quantity: number;
};

// The Item Card component will serve as the core visual element of the Catalog Page. It will be used to display data retrieved from the API in a structured and readable way. Each card should balance clarity, responsiveness, and accessibility while following Niles Biological’s branding guidelines. Cards will be modular so they can later be reused in filtered views or other catalog sections.
// Key terms explained:
// Component – a reusable piece of UI that can be used in multiple places across the app.
// Card Layout – a rectangular container grouping related information like a product image, name, and description.
// Responsive Design – ensures the card adjusts to different screen sizes (desktop, tablet, mobile).
// Accessibility (a11y) – making the card usable by everyone, including screen reader and keyboard users.
// Props / Inputs – the data passed into the card component (e.g., ItemName, Category, UnitCost).
// Implementation notes:
//     Structure – include a title (ItemName), category, short description, unit cost, and optional image placeholder.
//     Visual layout – use simple spacing, clear text hierarchy (larger name, smaller secondary info), and an outlined or shadowed container.
//     Data binding – the card will receive its item data as props from the Catalog Page when the API fetch completes.
//     Responsive behavior – stack text elements vertically on small screens and align horizontally or in grid layouts on larger screens.
//     Accessibility basics – ensure the card is keyboard-focusable and readable by screen readers, with alt text for images.
//     Brand consistency – use the same color palette, typography, and corner radius as the landing page design system.
//     Verification – confirm cards render correctly with mock and live API data, scale properly in grids, and maintain readable contrast.
// Acceptance Criteria
//     A reusable Item Card component exists and accepts item data (e.g., ItemName, Category, Description, UnitCost).
//     Layout displays all primary fields clearly and maintains proper spacing and alignment.
//     Cards respond correctly to various screen sizes without overlap or truncation.
//     Accessibility features (focus state, readable text, alt text for images) are present and verified.
//     Style matches the site’s branding and complements the catalog grid layout.
//     Cards render both mock data and real API data with no visual or console errors.

// export default function ItemCard({ item }: { item: Item }) {
//   return (
//     <article className="card">
//       {item.imageUrl ? (
//         <img src={item.imageUrl} alt={item.name} loading="lazy" />
//       ) : null}

//       <div className="card-body">
//         <h3 id={`item-${item.id}-title`}>{item.name}</h3>
//         {item.description ? <p>{item.description}</p> : null}
//       </div>
//     </article>
//   );
// }

export default function ItemCard({ item }: { item: Item }) {

    // Destructure data
    const { id, itemName, category, description, unitCost, imageUrl, stock, quantity } = item;

    // Function 
    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {

        event.preventDefault();
        // Send to the item page - for now, open image in new tab 
        window.open(imageUrl, "_self");

    };

    // Styles
    const itemCardStyle = {

        border: '1px solid #cccccc',
        borderRadius: '8px',
        padding: '16px',
        //margin: '16px',
        boxShadow: '2px 2px 12px rgba(0, 0, 0, 0.1)',
        width: '100%',
        height: 'auto',
        minHeight: 'fit-content',

    }

    const titleStyle = {

        color: 'blue',
        fontSize: '18px',

    };

    const imageStyle = {

        objectFit: 'cover',
        width: '100%',
        height: 'auto',
        minHeight: '200px',
        maxHeight: '200px',
        display: 'block',
        marginTop: 'auto',
        marginBottom: 'auto',
        borderRadius: '8px',
        border: '1px solid #7F7F7F',

    };

    const descriptionStyle = {
        
        fontSize: '14px',
        color: '#555555',
        marginTop: '8px',

    }

    const categoryStyle = {
        
        fontSize: '12px',
        color: '#aaaaaa',
        marginTop: '4px',

    }

    const costStyle = {
        
        fontSize: '12px',
        color: '#aaaaaa',
        marginTop: '4px',

    }

    const unitStyle = {
        
        fontSize: '12px',
        color: '#aaaaaa',
        marginTop: '4px',

    }

    const stockStyle = stock ? {
        fontSize: '12px',
        color: '#008000',
        marginTop: '4px',
    } : {
        fontSize: '12px',
        color: '#FF0000',
        marginTop: '4px',
    };

    // HTML 
    return (
        <div className="item-card" onClick={handleClick} style={itemCardStyle}>
            <h2 className="item-card-title" style={titleStyle}>{itemName}</h2>
            <img className="item-card-image" src={imageUrl} alt={itemName} style={imageStyle} />
            <p className="item-card-category" style={categoryStyle}>Category: {category}</p>
            <p className="item-card-description" style={descriptionStyle}>Description: {description}</p>
            <p className="item-card-cost" style={costStyle}>Cost: ${unitCost.toFixed(2)}</p>
            {/* <p className="item-card-unit">Unit: {Unit}</p> */}
            <p className="item-card-stock" style={stockStyle}>{stock ? stock + " available" : "Out of Stock"}</p>
        </div>
    );

}