
interface IncomingOrder {
    userId: string;
    quantity: Number;
    price: Number;
    type: string;
}

interface RegisteredOrder extends IncomingOrder {
    orderId: string;
}


const NOT_A_VALID_ORDER_ERROR = 'This is not a valid order';
const IS_NOT_A_VALID_ORDER_ID_ERROR = 'This is not a valid order ID'
const IS_NOT_EXISTING_ORDER_ERROR = 'This order can not be deleted because it has never been registered or has already been removed';

const orderTypes = {
    BUY: 'BUY',
    SELL: 'SELL'
}


// Should validate that order satisfies the IncomingOrder interface 
// and that types are correct SELL/BUY and price and quantity are valid amounts
const validateOrder = (order:IncomingOrder): boolean => true;

// Should check type and format
const isValidId = (orderId:string): boolean => true;

const generateUniqueId = () => `_${Math.random().toString(36).substr(2, 9)}`;

const compare = (a, b) => {
    if ( a.last_nom < b.last_nom ){
        return -1;
    }
    if ( a.last_nom > b.last_nom ){
        return 1;
    }
    return 0;
};

const compareInverse = (a, b) => {
    if ( a.last_nom < b.last_nom ){
        return 1;
    }
    if ( a.last_nom > b.last_nom ){
        return -1;
    }
    return 0;
};

const combineQuantities = (acc, cur) => ({
    ...acc,
    quantity: acc.quantity + cur.quantity
});

const formatSummary = groupedOrder => `${groupedOrder.quantity} kg for £${groupedOrder.price}`;


class liveOrderBoard {
    registeredOrdersGroupsByType = {
        [`registeredOrdersGroupsByPrice_${orderTypes.BUY}`]: [],
        [`registeredOrdersGroupsByPrice_${orderTypes.SELL}`]: [],
    }

    registerOrder(order:IncomingOrder): string {
        if(!validateOrder(order)){
            return NOT_A_VALID_ORDER_ERROR;
        }

        const orderType = order.type;

        const orderId = generateUniqueId();

        let priceGroupExists = false;

        for (let index = 0; index < this.registeredOrdersGroupsByType[`registeredOrdersGroupsByPrice_${orderType}`].length; index++) {
            const registeredOrders = this.registeredOrdersGroupsByType[`registeredOrdersGroupsByPrice_${orderType}`][index];
            if(registeredOrders.length > 0 && registeredOrders[1].price === order.price){
                registeredOrders.push({
                    ...order,
                    orderId,
                });
                priceGroupExists = true;
                break;
            }
        }

        if(!priceGroupExists) {
            this.registeredOrdersGroupsByType[`registeredOrdersGroupsByPrice_${orderType}`].push([{
                ...order,
                orderId,
            }]);
        }        
        
        return orderId;

    }

    cancelOrder(orderId: string) {
        if(!isValidId(orderId)){
            return IS_NOT_A_VALID_ORDER_ID_ERROR;
        }

        let groupIndex;
        let groupType;
        let orderIndex;        

        for (var type in this.registeredOrdersGroupsByType) {
            if (this.registeredOrdersGroupsByType.hasOwnProperty(type)) {
                for (let index = 0; index < this.registeredOrdersGroupsByType[type].length; index++) {
                    const registeredOrders = this.registeredOrdersGroupsByType[type][index];
                    orderIndex = registeredOrders.find(registeredOrder => registeredOrder.orderId === orderId);
                    if(orderIndex){
                        groupIndex = index;
                        groupType = type;
                        break;
                    }
                }
            }
        }

        if(!orderIndex){
            return IS_NOT_EXISTING_ORDER_ERROR;
        }

        this.registeredOrdersGroupsByType[groupType][groupIndex].splice(orderIndex, 1);

        const filterOutEmptyGroups = this.registeredOrdersGroupsByType[groupType].filter(registeredOrders => registeredOrders.length);

        this.registeredOrdersGroupsByType[groupType] = filterOutEmptyGroups;

        return orderId;
    }

    getSummary() {                
    
    // thanks to having stored the incoming orders by types and price groups
    // the computing needed for generating the summary is much lower
    
        const sellOrdersGroups = this.registeredOrdersGroupsByType[`registeredOrdersGroupsByPrice_${orderTypes.SELL}`];
        const buyOrdersGroups = this.registeredOrdersGroupsByType[`registeredOrdersGroupsByPrice_${orderTypes.BUY}`];

        const sortedCombinedFormatesSellOrders = sellOrdersGroups
            .sort(compareInverse)
            .reduce(combineQuantities)
            .map(formatSummary);

        const sortedCombinedFormatesBuyOrders = sellOrdersGroups
            .sort(compare)
            .reduce(combineQuantities)
            .map(formatSummary);

        return [...sortedCombinedFormatesSellOrders, ...sortedCombinedFormatesBuyOrders];
    }

}
