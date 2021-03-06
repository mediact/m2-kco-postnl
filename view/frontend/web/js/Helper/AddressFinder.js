/**
 * This file is part of the Klarna KCO PostNL module
 *
 *
 * For the full copyright and license information, please view the NOTICE
 * and LICENSE files that were distributed with this source code.
 */
define([
    'ko',
    'Magento_Checkout/js/model/quote',
    'jquery',
    'Magento_Customer/js/model/customer'
], function (
    ko,
    quote,
    $,
    customer
) {
    'use strict';

    var address = {
            postcode    : null,
            country     : null,
            street      : null,
            firstname   : null,
            lastname    : null,
            telephone   : null,
            housenumber : null
        },
        countryCode,
        timer,
        allFieldsExists = true,
        valueUpdateNotifier = ko.observable(null);

    var fields = [
        "input[name*='street[0]']",
        "input[name*='street[1]']",
        "input[name*='postcode']",
        "select[name*='country_id']"
    ];

    /**
     * Without cookie data Magento is not observing the fields so the AddressFinder is never triggered.
     * The Timeout is needed so it gives the Notifier the chance to retrieve the correct country code,
     * and not the default value.
     */
    $(document).on('change', fields.join(','), function () {
        // Clear timeout if exists.
        if (typeof timer !== 'undefined') {
            clearTimeout(timer);
        }

        timer = setTimeout(function () {
            countryCode = $("select[name*='country_id']").val();
            valueUpdateNotifier.notifySubscribers();
        }, 500);
    });

    /**
     * Collect the needed information from the quote
     */
    return ko.computed(function () {
        valueUpdateNotifier();

        var housenumber;
        if (window.checkoutConfig.postcode !== undefined) {
            housenumber = $("input[name*='tig_housenumber']").val();
        }

        /**
         * The street is not always available on the first run.
         */
        var shippingAddress = quote.shippingAddress();
        if (shippingAddress && shippingAddress.street) {
            address = {
                street: shippingAddress.street,
                postcode: shippingAddress.postcode,
                lastname: shippingAddress.lastname,
                firstname: shippingAddress.firstname,
                telephone: shippingAddress.telephone,
                country: shippingAddress.countryId,
                housenumber : housenumber
            };

            return address;
        }

        allFieldsExists = true;
        $.each(fields, function () {
            /** Second street may not exist and is therefor not required and should only be observed. */
            if (!$(this).length && this !== "input[name*='street[1]']") {
                allFieldsExists = false;
                return false;
            }
        });

        if (!allFieldsExists) {
            return null;
        }

        /**
         * Unfortunately Magento does not always fill all fields, so get them ourselves.
         */
        address.street = {
            0 : $("input[name*='street[0]']").val(),
            1 : $("input[name*='street[1]']").val()
        };

        if (housenumber !== undefined) {
            address.housenumber = housenumber;
        }

        address.postcode   = $("input[name*='postcode']").val();
        address.firstname  = $("input[name*='firstname']").val();
        address.lastname   = $("input[name*='lastname']").val();
        address.telephone  = $("input[name*='telephone']").val();

        if (!address.country || address.country !== countryCode) {
            address.country = $("select[name*='country_id']").val();
        }

        if (!address.country || !address.postcode || !address.street[0]) {
            return false;
        }

        return address;
    }.bind(this));
});
