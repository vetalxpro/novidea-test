public with sharing class ObjectRecordsController {
    public ObjectRecordsController() {
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getObjects() {
        try {
            List<String> result;

            Set<String> objectNames = new Set<String>();
            Map<String, Schema.SObjectType> gd = Schema.getGlobalDescribe();

            for (Schema.SObjectType d : gd.values()) {
                Schema.DescribeSObjectResult ds = d.getDescribe();
                if (!ds.isCreateable())
                    continue;
                if (
                    ds.isCustom() == false &&
                    ds.getRecordTypeInfos().size() > 0
                ) {
                    objectNames.add(ds.getName());
                } else if (ds.isCustom()) {
                    objectNames.add(ds.getName());
                }
            }
            result = new List<String>(objectNames);
            result.sort();
            return result;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<SObject> getRecords(
        String objectApiName,
        String fields,
        Integer perPage,
        Id lastRecordId
    ) {
        try {
            String query = 'SELECT ' + fields + ' FROM ' + objectApiName;

            if (lastRecordId != null) {
                query += ' WHERE Id > :lastRecordId';
            }

            query = query + ' ORDER BY Id LIMIT ' + perPage;
            System.debug(query);
            List<SObject> records = Database.query(query);
            return records;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}