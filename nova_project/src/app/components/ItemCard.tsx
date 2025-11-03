"use client";

type Item = {
    id: number;
    itemName: string;
    category: string;
    description: string;
    unitCost: number;
    unitType: string;
    quantity: number;
    imageUrl: string;
    stock: number;
};

export default function ItemCard({ item }: { item: Item }) {

    // Destructure data
    const { id, itemName, category, description, unitCost, unitType, quantity, imageUrl, stock } = item;

    // Function 
    const handleClick = (event: React.KeyboardEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {

        if (event.type === 'keydown' && event.key !== 'Enter') return;
        if (event.type === 'click') event.preventDefault();

        event.preventDefault();
        // Send to the item page - for now, open image in new tab 
        window.open(imageUrl, "_self");

    };

    // Styles
    const itemCardStyle = {

        border: '1px solid #cccccc',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '2px 2px 12px rgba(0, 0, 0, 0.1)',
        width: '100%',
        height: 'auto',
        minHeight: 'fit-content',

    }

    const titleStyle = {

        color: '#000000',
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
        color: '#555555',
        marginTop: '4px',

    }

    const costStyle = {
        
        fontSize: '12px',
        color: '#555555',
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
        <div className="item-card" onClick={handleClick} style={itemCardStyle} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleClick(e)}>
            <h2 className="item-card-title" style={titleStyle}>{itemName}</h2>
            <img className="item-card-image" src={imageUrl} alt={itemName} style={imageStyle} />
            <p className="item-card-description" style={descriptionStyle}>Description: {description}</p>
            <p className="item-card-category" style={categoryStyle}>Category: {category}</p>
            <p className="item-card-cost" style={costStyle}>Cost: ${unitCost.toFixed(2)}</p>
            <p className="item-card-stock" style={stockStyle}>{stock ? stock + " available" : "Out of Stock"}</p>
        </div>
    );

}